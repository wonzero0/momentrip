// Server-only CLI. Never import this module from src/. Dry run is the default.
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, chmod } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

class MigrationError extends Error {}
const collections = ['users','rooms','photos','missionCompletions','rewardTransactions','diaries','fourCuts','shares','inquiries'];
export function authEmail(username) {
  return `user-${createHash('sha256').update(username.trim().toLowerCase()).digest('hex').slice(0,56)}@auth.momentrip.invalid`;
}
const snake = key => key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
export function fields(record, names) {
  return Object.fromEntries(names.filter(key => record[key] !== undefined).map(key => [key === 'desc' ? 'description' : snake(key),record[key]]));
}
export function validateLegacy(db) {
  for (const name of collections) {
    db[name] ??= [];
    if (!Array.isArray(db[name])) throw new MigrationError(`Invalid collection: ${name}`);
    if (new Set(db[name].map(row => row.id)).size !== db[name].length || db[name].some(row => !row.id)) throw new MigrationError(`Invalid IDs: ${name}`);
  }
  const ids = name => new Set(db[name].map(row => row.id));
  const users=ids('users'),rooms=ids('rooms'),photos=ids('photos');
  const ownedPhoto=(id, uid)=>db.photos.some(p=>p.id===id && p.userId===uid);
  for (const name of collections.filter(name => !['users','rooms'].includes(name))) {
    for (const row of db[name]) {
      if (!users.has(row.userId)) throw new MigrationError(`Missing owner: ${name}`);
      if (row.roomId && !rooms.has(row.roomId)) throw new MigrationError(`Missing room: ${name}`);
      if (row.photoId && !ownedPhoto(row.photoId,row.userId)) throw new MigrationError(`Invalid photo ownership: ${name}`);
      if (row.photoIds?.some(id=>!photos.has(id)||!ownedPhoto(id,row.userId))) throw new MigrationError(`Invalid photo references: ${name}`);
    }
  }
  for (const room of db.rooms) {
    if (!users.has(room.ownerId)) throw new MigrationError('Missing room owner');
    // Unknown legacy member IDs are display snapshots, never authenticated members.
  }
  return db;
}
export function decodeImage(value) {
  const match=/^data:(image\/(?:jpeg|png|webp|gif|heic|heif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value || '');
  if (!match) throw new MigrationError('Unsupported/missing source image; original data left unchanged.');
  const body=Buffer.from(match[2],'base64');
  if (!body.length || body.length>16*1024*1024) throw new MigrationError('Image exceeds bucket limits');
  return {body,mime:match[1]};
}
function check(result) { if(result.error) throw new MigrationError(`Supabase operation failed (${result.error.code || result.error.status || 'remote error'}). No credentials logged.`); return result.data; }
export async function main(args=process.argv.slice(2)) {
  const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
  const source=path.resolve(option('--source','server/data/db.json'));
  const uploads=path.resolve(option('--uploads','server/uploads'));
  const journalPath=path.resolve(option('--journal','server/data/supabase-migration.json'));
  const raw=await readFile(source,'utf8');
  const hash=createHash('sha256').update(raw).digest('hex');
  const db=validateLegacy(JSON.parse(raw));
  const images=new Map();
  // Preflight every image before creating any remote account or record.
  for (const [name,imageKey] of [['photos','dataUrl'],['diaries','imageDataUrl'],['fourCuts','imageDataUrl']]) {
    for (const row of db[name]) {
      if (name!=='photos' && !row[imageKey]) continue;
      let image;
      if (row[imageKey]) image=decodeImage(row[imageKey]);
      else {
        // Do not follow absolute legacy filesystem paths outside the selected uploads root.
        const filename=path.basename(row.filename || row.uploadPath || '');
        if (!filename) throw new MigrationError('Missing photo source');
        const body=await readFile(path.join(uploads,filename));
        image=decodeImage(`data:${row.mimeType || 'image/jpeg'};base64,${body.toString('base64')}`);
      }
      const digest=createHash('sha256').update(image.body).digest('hex');
      images.set(`${name}/${row.id}`,{...image,path:`${row.userId}/legacy/${name}/${encodeURIComponent(row.id)}-${digest}`});
    }
  }
  console.log('Source collection counts:', Object.fromEntries(collections.map(name=>[name,db[name].length])));
  console.log(`Validated ${images.size} images. Sessions/password hashes are excluded; original files are never deleted.`);
  if (!args.includes('--apply')) { console.log('Dry run passed. Use --apply only after applying SQL and backing up the source.'); return; }
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !key.startsWith('sb_secret_')) throw new MigrationError('Set server-only SUPABASE_URL and SUPABASE_SECRET_KEY.');
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const targetHash=createHash('sha256').update(url).digest('hex');
  let journal;
  try { journal=JSON.parse(await readFile(journalPath,'utf8')); }
  catch(error) { if(error.code!=='ENOENT') throw error; journal={sourceHash:hash,targetHash,users:{}}; }
  if(journal.sourceHash!==hash || journal.targetHash!==targetHash) throw new MigrationError('Journal belongs to a different source/project. Use a new journal path.');
  async function persist() {
    await mkdir(path.dirname(journalPath),{recursive:true});
    const temporary=`${journalPath}.tmp`;
    await writeFile(temporary,JSON.stringify(journal,null,2),{mode:0o600});
    await chmod(temporary,0o600);
    await rename(temporary,journalPath);
  }
  await persist();
  const authUsers=[];
  for(let page=1;;page++) {
    const batch=check(await client.auth.admin.listUsers({page,perPage:1000})).users;
    authUsers.push(...batch); if(batch.length<1000) break;
  }
  for(const user of db.users) {
    const email=authEmail(user.username);
    let remote=authUsers.find(item=>item.email===email);
    if(remote && (remote.app_metadata.legacy_id!==user.id || remote.app_metadata.legacy_source!==hash)) throw new MigrationError('Auth account collision; manual account mapping required.');
    if(!remote) {
      journal.users[user.id] ??= {username:user.username,temporaryPassword:randomBytes(24).toString('base64url')};
      await persist(); // Save the temporary password before the network request for restart safety.
      remote=check(await client.auth.admin.createUser({email,password:journal.users[user.id].temporaryPassword,email_confirm:true,
        app_metadata:{legacy_import:true,legacy_id:user.id,legacy_source:hash},user_metadata:{username:user.username,display_name:user.displayName}})).user;
      if(!remote) throw new MigrationError('Auth account creation returned no user');
    }
    journal.users[user.id] ??= {username:user.username};
    journal.users[user.id].authId=remote.id;
    await persist();
    const existing=check(await client.from('profiles').select('auth_id').eq('id',user.id).maybeSingle());
    if(existing && existing.auth_id!==remote.id) throw new MigrationError('Profile ID collision');
    if(!existing) check(await client.from('profiles').insert({...fields(user,['id','username','displayName','code','createdAt']),auth_id:remote.id,email:user.email || email}));
  }
  const insert=async(table,rows)=>{
    for(const row of rows) {
      const existing=check(await client.from(table).select('*').eq('id',row.id).maybeSingle());
      if(existing) {
        const owner=row.user_id || row.owner_id;
        if(owner && owner!==(existing.user_id || existing.owner_id)) throw new MigrationError(`Owner collision: ${table}`);
        continue; // Resume without overwriting subsequent app edits.
      }
      check(await client.from(table).insert(row));
    }
  };
  await insert('rooms',db.rooms.map(row=>({...fields(row,['id','ownerId','name','inviteCode','planText','createdAt']),legacy_members:(row.members || []).filter(member=>!db.users.some(user=>user.id===member.id)).map(member=>({id:member.id,name:member.name,code:member.code,emoji:member.emoji || '✈️'}))})));
  for(const room of db.rooms) {
    const owner=db.users.find(user=>user.id===room.ownerId);
    const members=new Map((room.members || []).map(member=>[member.id,member]));
    members.set(owner.id,{id:owner.id,name:owner.displayName,code:owner.code,emoji:'✈️',owner:true});
    for(const member of [...members.values()].filter(member=>db.users.some(user=>user.id===member.id))) check(await client.from('room_members').upsert({room_id:room.id,user_id:member.id,name:member.name,code:member.code,emoji:member.emoji || '✈️',owner:member.id===owner.id},{onConflict:'room_id,user_id',ignoreDuplicates:true}));
  }
  for(const image of images.values()) {
    const result=await client.storage.from('momentrip-photos').upload(image.path,image.body,{contentType:image.mime,upsert:false});
    if(result.error) {
      // A retry may encounter an uploaded object; verify its hash before accepting it.
      const existing=check(await client.storage.from('momentrip-photos').download(image.path));
      const bytes=Buffer.from(await existing.arrayBuffer());
      if(!bytes.equals(image.body)) throw new MigrationError('Existing Storage object differs from source');
    }
  }
  await insert('photos',db.photos.map(row=>({...fields(row,['id','userId','roomId','label','date','source','filename','mimeType','createdAt']),storage_path:images.get(`photos/${row.id}`).path})));
  await insert('mission_completions',db.missionCompletions.map(row=>fields(row,['id','userId','roomId','missionId','photoId','completedAt'])));
  await insert('reward_transactions',db.rewardTransactions.map(row=>fields(row,['id','userId','category','amount','title','desc','missionId','roomId','createdAt'])));
  await insert('diaries',db.diaries.map(row=>({...fields(row,['id','userId','date','title','text','photoIds','createdAt','updatedAt']),image_path:images.get(`diaries/${row.id}`)?.path || null})));
  await insert('four_cuts',db.fourCuts.map(row=>({...fields(row,['id','userId','photoIds','filter','createdAt']),image_path:images.get(`fourCuts/${row.id}`)?.path || null})));
  await insert('shares',db.shares.map(row=>fields(row,['id','userId','kind','targetId','channel','createdAt'])));
  await insert('inquiries',db.inquiries.map(row=>fields(row,['id','userId','category','message','createdAt'])));
  journal.completedAt=new Date().toISOString(); await persist();
  console.log('Import completed. Account mapping/temporary passwords are in the private journal, not stdout. Distribute privately and change passwords after login.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch((error)=>{if(error instanceof MigrationError) console.error(error.message); console.error('Migration stopped. Check source validation, SQL setup, server-only environment, and private journal. No source files were removed.');process.exitCode=1;});

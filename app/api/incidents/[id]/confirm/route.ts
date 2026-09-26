import {getRepository} from '@/lib/incidents';
import {apiError} from '@/lib/server/errors';
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;return Response.json(await (await getRepository()).addConfirmation(id));}catch(e){return apiError(e);}}

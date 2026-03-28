import type { PetAlertType } from "@server/db/schema";
import { petAlertRepository, type PetAlertRepository } from "@server/repositories/PetAlertRepository";
import { handleError } from "@server/utils/handleError";
import {isPetAlertValid} from "@shared/validators/isPetAlertValid";

export class PetAlertService{

    private petAlertRepo:PetAlertRepository;

    constructor(){
        this.petAlertRepo=petAlertRepository;
    }

    async createPetAlert(data:Partial<PetAlertType>){
        const result = isPetAlertValid(data);
              try{
               
              if(result.error){
                 handleError(result.error);
                return null;}
               if (!result.success) return null;
              }
              catch (error){
                 handleError(error);
              }
              if(result.data==null) return null;
              this.petAlertRepo.create(result.data);
    }

    async getPetMatchById(id:string):Promise<PetAlertType|null>{
         try{
         return await this.petAlertRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
    }

    async getAllPetAlerts(){
         try{
      return await this.petAlertRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
    }

    async updatePetAlert(id:string,data:Partial<PetAlertType>){
        try{
         return await this.petAlertRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
    }
     async deletePetAlert(id:string):Promise<boolean>{
      try{
         await this.petAlertRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
   }
}

export const petAlertService=new PetAlertService;
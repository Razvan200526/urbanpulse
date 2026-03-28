import type { NotificationType } from "@server/db/schema";
import { notificationRepository, type NotificationRepository } from "@server/repositories/NotificationRepository";
import { handleError } from "@server/utils/handleError";
import {isNotificationRequestValid} from "@shared/validators/isNotificationValid";
export class NotificationService{
    private notificationRepo:NotificationRepository;

    constructor(){
        this.notificationRepo=notificationRepository;
    }

    async createNotification(data:Partial<NotificationType>){
        const result = isNotificationRequestValid(data);
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
              this.notificationRepo.create(result.data);   
    }

    async getNotificationById(id:string):Promise<NotificationType|null>{
        try{
         return await this.notificationRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllSkill(){
      try{
      return await this.notificationRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
    }

    async getAllNotification(){
        try{
      return await this.notificationRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
    }
async updateNotification(id:string,data:Partial<NotificationType>){
     try{
         return await this.notificationRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
}
async deleteNotification(id:string){
    try{
         await this.notificationRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
}
}

export const notificationService=new NotificationService;
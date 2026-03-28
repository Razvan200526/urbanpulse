import type { ReportType } from "@server/db/schema";
import { reportRepository, type ReportRepository } from "@server/repositories/ReportRepository";
import { handleError } from "@server/utils/handleError";
import { isReportRequestValid } from "@shared/validators/isReportValid";

export class ReportSercive{
    private reportRepo:ReportRepository;

    constructor(){
        this.reportRepo=reportRepository;
    }

    async createReport(data:Partial<ReportType>){
        const result = isReportRequestValid(data);
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
              this.reportRepo.create(result.data);
               
    }
     async getReportById(id:string):Promise<ReportType|null>{
          try{
             return await this.reportRepo.getOne(id);
          }
          catch(error){
             handleError(error);
             return null;
          }
       }
       async getReportSkill(){
          try{
          return await this.reportRepo.getAll();
       }
       catch(error){
          handleError(error);
          return null;
       }
       }
    
       async updateReport(id:string,data:Partial<ReportType>){
          try{
             return await this.reportRepo.update(id,data);
          }
          catch(error){
             handleError(error);
             return null;
          }
       }
       async deleteReport(id:string):Promise<boolean>{
          try{
             await this.reportRepo.delete(id);
             return true;
          }
          catch(error){
             handleError(error);
             return false;
          }
       }
}

export const reportService=new ReportSercive;
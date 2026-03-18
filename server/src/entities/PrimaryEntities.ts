import { PulseEntity } from "./PulseEntity";
import { UserEntity } from "./UserEntity";

/**
 * Currently won't use this array for entity management since I'll be using the api Datasource with the *.ts to register by files
 * I'm not sure about this change but I'll test first and see if it works so we don't have to add entities manually
 */
export const PrimaryEntities = [UserEntity, PulseEntity];

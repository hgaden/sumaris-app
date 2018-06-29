import { Referential, Department, Person, toDateISOString, fromDateISOString, StatusIds, Cloneable, Entity, joinProperties } from "../../core/services/model";
import { Moment } from "moment/moment";
import { DATE_ISO_PATTERN } from "../constants";

export const LocationLevelIds = {
  COUNTRY: 1,
  PORT: 2
}

export { Referential, Person, toDateISOString, fromDateISOString, joinProperties, StatusIds, Cloneable, Entity, Department };

export function entityToString(obj: Entity<any> | any, properties?: String[]): string | undefined {
  return obj && obj.id && joinProperties(obj, properties || ['name']) || undefined;
}

export function referentialToString(obj: Referential | any, properties?: String[]): string | undefined {
  return obj && obj.id && joinProperties(obj, properties || ['label', 'name']) || undefined;
}

export function vesselFeaturesToString(obj: VesselFeatures | any): string | undefined {
  return obj && obj.vesselId && joinProperties(obj, ['exteriorMarking', 'name']) || undefined;
}

export class VesselFeatures extends Entity<VesselFeatures>  {
  vesselId: number;
  vesselTypeId: number;
  name: string;
  startDate: Date | Moment;
  endDate: Date | Moment;
  exteriorMarking: string;
  basePortLocation: Referential;
  creationDate: Date | Moment;
  recorderDepartment: Referential;
  recorderPerson: Person;
  comments: string;

  constructor() {
    super();
    this.basePortLocation = new Referential();
    this.recorderDepartment = new Referential();
    this.recorderPerson = new Person();
  }

  clone(): VesselFeatures {
    const target = new VesselFeatures();
    this.copy(target);
    target.basePortLocation = this.basePortLocation && this.basePortLocation.clone() || undefined;
    target.recorderDepartment = this.recorderDepartment && this.recorderDepartment.clone() || undefined;
    target.recorderPerson = this.recorderPerson && this.recorderPerson.clone() || undefined;
    return target;
  }

  copy(target: VesselFeatures): VesselFeatures {
    target.fromObject(this);
    return target;
  }

  asObject(): any {
    const target: any = super.asObject();
    target.basePortLocation = this.basePortLocation && this.basePortLocation.asObject() || undefined;
    target.startDate = toDateISOString(this.startDate);
    target.endDate = toDateISOString(this.endDate);
    target.creationDate = toDateISOString(this.creationDate);
    target.recorderDepartment = this.recorderDepartment && this.recorderDepartment.asObject() || undefined;
    target.recorderPerson = this.recorderPerson && this.recorderPerson.asObject() || undefined;

    return target;
  }

  fromObject(source: any): VesselFeatures {
    super.fromObject(source);
    this.exteriorMarking = source.exteriorMarking;
    this.name = source.name;
    this.comments = source.comments;
    this.vesselId = source.vesselId;
    this.vesselTypeId = source.vesselTypeId;
    this.startDate = fromDateISOString(source.startDate);
    this.endDate = fromDateISOString(source.endDate);
    this.creationDate = fromDateISOString(source.creationDate);
    source.basePortLocation && this.basePortLocation.fromObject(source.basePortLocation);
    source.recorderDepartment && this.recorderDepartment.fromObject(source.recorderDepartment);
    source.recorderPerson && this.recorderPerson.fromObject(source.recorderPerson);
    return this;
  }
}
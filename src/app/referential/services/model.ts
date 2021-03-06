import { Referential, ReferentialRef, EntityUtils, Department, Person, toDateISOString, fromDateISOString, StatusIds, Cloneable, Entity, joinProperties, entityToString, referentialToString } from "../../core/services/model";
import { Moment } from "moment/moment";

export const LocationLevelIds = {
  COUNTRY: 1,
  PORT: 2
}

export const GearLevelIds = {
  FAO: 1
}

export const TaxonGroupIds = {
  FAO: 2,
  METIER: 3
}

export const TaxonomicLevelIds = {
  ORDO: 13,
  FAMILY: 17,
  GENUS: 26,
  SUBGENUS: 27,
  SPECIES: 28,
  SUBSPECIES: 29
}

export const PmfmIds = {
  TAG_ID: 82,
  IS_DEAD: 94,
  DEATH_TIME: 101,
  VERTEBRAL_COLUMN_ANALYSIS: 102
}

export const MethodIds = {
  MEASURED_BY_OBSERVER: 1,
  OBSERVED_BY_OBSERVER: 2,
  ESTIMATED_BY_OBSERVER: 3,
  CALCULATED: 4
}

export const PmfmLabelPatterns = {
  BATCH_WEIGHT: /^BATCH_(.+)_WEIGHT$/
}

const PMFM_NAME_REGEXP = new RegExp(/^\s*([^\/]+)[/]\s*(.*)$/);

export { Referential, ReferentialRef, EntityUtils, Person, toDateISOString, fromDateISOString, joinProperties, StatusIds, Cloneable, Entity, Department, entityToString, referentialToString };

export function vesselFeaturesToString(obj: VesselFeatures | any): string | undefined {
  return obj && obj.vesselId && joinProperties(obj, ['exteriorMarking', 'name']) || undefined;
}

export function getPmfmName(pmfm: PmfmStrategy, opts?: {
  withUnit: boolean
}): string {
  var matches = PMFM_NAME_REGEXP.exec(pmfm.name);
  const name = matches && matches[1] || pmfm.name;
  if (opts && opts.withUnit && pmfm.unit && (pmfm.type == 'integer' || pmfm.type == 'double')) {
    return `${name} (${pmfm.unit})`;
  }
  return name;
}

export class VesselFeatures extends Entity<VesselFeatures>  {

  static fromObject(source: any): VesselFeatures {
    const res = new VesselFeatures();
    res.fromObject(source);
    return res;
  }

  vesselId: number;
  vesselTypeId: number;
  name: string;
  startDate: Date | Moment;
  endDate: Date | Moment;
  exteriorMarking: string;
  basePortLocation: ReferentialRef;
  creationDate: Date | Moment;
  recorderDepartment: Department;
  recorderPerson: Person;
  comments: string;

  constructor() {
    super();
    this.basePortLocation = new ReferentialRef();
    this.recorderDepartment = new Department();
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

  asObject(minify?: boolean): any {
    const target: any = super.asObject(minify);
    target.basePortLocation = this.basePortLocation && this.basePortLocation.asObject(minify) || undefined;
    target.startDate = toDateISOString(this.startDate);
    target.endDate = toDateISOString(this.endDate);
    target.creationDate = toDateISOString(this.creationDate);
    target.recorderDepartment = this.recorderDepartment && this.recorderDepartment.asObject(minify) || undefined;
    target.recorderPerson = this.recorderPerson && this.recorderPerson.asObject(minify) || undefined;

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


export class PmfmStrategy extends Entity<PmfmStrategy>  {

  static fromObject(source: any): PmfmStrategy {
    const res = new PmfmStrategy();
    res.fromObject(source);
    return res;
  }
  pmfmId: number;
  methodId: number;
  label: string;
  name: string;
  unit: string;
  type: string;
  minValue: number;
  maxValue: number;
  maximumNumberDecimals: number;
  defaultValue: number;
  acquisitionNumber: number;
  isMandatory: boolean;
  rankOrder: number;

  acquisitionLevel: string;
  gears: string[];
  qualitativeValues: ReferentialRef[];

  constructor() {
    super();
  }

  clone(): PmfmStrategy {
    const target = new PmfmStrategy();
    this.copy(target);
    target.qualitativeValues = this.qualitativeValues && this.qualitativeValues.map(qv => qv.clone()) || undefined;
    return target;
  }

  copy(target: PmfmStrategy): PmfmStrategy {
    target.fromObject(this);
    return target;
  }

  asObject(): any {
    const target: any = super.asObject();
    target.qualitativeValues = this.qualitativeValues && this.qualitativeValues.map(qv => qv.asObject()) || undefined;
    return target;
  }

  fromObject(source: any): PmfmStrategy {
    super.fromObject(source);

    this.pmfmId = source.pmfmId;
    this.methodId = source.methodId;
    this.label = source.label;
    this.name = source.name;
    this.unit = source.unit;
    this.type = source.type;
    this.minValue = source.minValue;
    this.maxValue = source.maxValue;
    this.maximumNumberDecimals = source.maximumNumberDecimals;
    this.defaultValue = source.defaultValue;
    this.acquisitionNumber = source.acquisitionNumber;
    this.isMandatory = source.isMandatory;
    this.rankOrder = source.rankOrder;
    this.acquisitionLevel = source.acquisitionLevel;
    this.gears = source.gears || [];
    this.qualitativeValues = source.qualitativeValues && source.qualitativeValues.map(ReferentialRef.fromObject) || [];
    return this;
  }
}
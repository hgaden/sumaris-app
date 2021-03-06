import { Component, OnInit, Input, OnDestroy, EventEmitter } from "@angular/core";
import { Observable, BehaviorSubject } from 'rxjs';
import { mergeMap, debounceTime, startWith } from "rxjs/operators";
import { ValidatorService, TableElement } from "angular4-material-table";
import { AppTableDataSource, AppTable, AccountService } from "../../core/core.module";
import { referentialToString, PmfmStrategy, Sample, TaxonGroupIds, MeasurementUtils, getPmfmName } from "../services/trip.model";
import { ModalController, Platform } from "@ionic/angular";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';
import { ReferentialRefService, ProgramService } from "../../referential/referential.module";
import { SampleValidatorService } from "../services/sample.validator";
import { FormBuilder } from "@angular/forms";
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { EntityUtils, ReferentialRef, isNotNil } from "../../core/services/model";
import { FormGroup } from "@angular/forms";
import { MeasurementsValidatorService } from "../services/trip.validators";
import { RESERVED_START_COLUMNS, RESERVED_END_COLUMNS } from "../../core/table/table.class";

const PMFM_ID_REGEXP = /\d+/;
const SAMPLE_RESERVED_START_COLUMNS: string[] = ['taxonGroup', 'sampleDate'];
const SAMPLE_RESERVED_END_COLUMNS: string[] = ['comments'];

@Component({
    selector: 'table-samples',
    templateUrl: 'samples.table.html',
    styleUrls: ['samples.table.scss'],
    providers: [
        { provide: ValidatorService, useClass: SampleValidatorService }
    ]
})
export class SamplesTable extends AppTable<Sample, { operationId?: number }> implements OnInit, OnDestroy, ValidatorService {

    private _program: string = environment.defaultProgram;
    private _acquisitionLevel: string;
    private _implicitTaxonGroup: ReferentialRef;
    private _dataSubject = new BehaviorSubject<Sample[]>([]);
    private _onRefreshPmfms = new EventEmitter<any>();

    loading = true;
    loadingPmfms = true;
    pmfms = new BehaviorSubject<PmfmStrategy[]>(undefined);
    measurementValuesFormGroupConfig: { [key: string]: any };
    data: Sample[];
    taxonGroups: Observable<ReferentialRef[]>;

    set value(data: Sample[]) {
        if (this.data !== data) {
            this.data = data;
            if (!this.loading) this.onRefresh.emit();
        }
    }

    get value(): Sample[] {
        return this.data;
    }

    @Input()
    set program(value: string) {
        if (this._program === value) return; // Skip if same
        this._program = value;
        if (!this.loading) {
            this._onRefreshPmfms.emit('set program');
        }
    }

    get program(): string {
        return this._program;
    }

    @Input()
    set acquisitionLevel(value: string) {
        if (this._acquisitionLevel !== value) {
            this._acquisitionLevel = value;
            if (!this.loading) this.onRefresh.emit();
        }
    }

    get acquisitionLevel(): string {
        return this._acquisitionLevel;
    }

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected platform: Platform,
        protected location: Location,
        protected modalCtrl: ModalController,
        protected accountService: AccountService,
        protected validatorService: SampleValidatorService,
        protected measurementsValidatorService: MeasurementsValidatorService,
        protected referentialRefService: ReferentialRefService,
        protected programService: ProgramService,
        protected translate: TranslateService,
        protected formBuilder: FormBuilder
    ) {
        super(route, router, platform, location, modalCtrl, accountService,
            RESERVED_START_COLUMNS.concat(SAMPLE_RESERVED_START_COLUMNS).concat(SAMPLE_RESERVED_END_COLUMNS).concat(RESERVED_END_COLUMNS)
        );
        this.i18nColumnPrefix = 'TRIP.SAMPLE.TABLE.';
        this.autoLoad = false;
        this.inlineEdition = true;
        this.setDatasource(new AppTableDataSource<any, { operationId?: number }>(
            Sample, this, this, {
                prependNewElements: false,
                onNewRow: (row) => this.onNewSample(row.currentData)
            }));
        //this.debug = true;
    };

    async ngOnInit() {
        super.ngOnInit();

        this._onRefreshPmfms
            .pipe(
                startWith('ngOnInit')
            )
            .subscribe((event) => {
                this.refreshPmfms(event)
            });

        this.pmfms
            .filter(pmfms => pmfms && pmfms.length > 0)
            .first()
            .subscribe(pmfms => {
                this.measurementValuesFormGroupConfig = this.measurementsValidatorService.getFormGroupConfig(pmfms);
                let displayedColumns = pmfms.map(p => p.pmfmId.toString());

                this.displayedColumns = RESERVED_START_COLUMNS
                    .concat(SAMPLE_RESERVED_START_COLUMNS)
                    .concat(displayedColumns)
                    .concat(SAMPLE_RESERVED_END_COLUMNS)
                    .concat(RESERVED_END_COLUMNS);

                this.loading = false;

                if (this.data) this.onRefresh.emit();
            });

        // Taxon group combo
        this.taxonGroups = this.registerCellValueChanges('taxonGroup')
            .pipe(
                debounceTime(250),
                mergeMap((value) => {
                    if (EntityUtils.isNotEmpty(value)) return Observable.of([value]);
                    value = (typeof value === "string") && value || undefined;
                    if (this.debug) console.debug("[sample-table] Searching taxon group on {" + (value || '*') + "}...");
                    return this.referentialRefService.loadAll(0, 10, undefined, undefined,
                        {
                            entityName: 'TaxonGroup',
                            levelId: TaxonGroupIds.FAO,
                            searchText: value as string,
                            searchAttribute: 'label'
                        }).first();
                })
            );

        this.taxonGroups.subscribe(items => {
            this._implicitTaxonGroup = (items.length === 1) && items[0];
        });

    }

    getRowValidator(): FormGroup {
        return this.getFormGroup();
    }

    getFormGroup(data?: any): FormGroup {
        let formGroup = this.validatorService.getFormGroup(data);
        if (this.measurementValuesFormGroupConfig) {
            formGroup.addControl('measurementValues', this.formBuilder.group(this.measurementValuesFormGroupConfig));
        }
        return formGroup;
    }

    loadAll(
        offset: number,
        size: number,
        sortBy?: string,
        sortDirection?: string,
        filter?: any,
        options?: any
    ): Observable<Sample[]> {
        if (!this.data) {
            if (this.debug) console.debug("[sample-table] Unable to load row: value not set (or not started)");
            return Observable.empty(); // Not initialized
        }
        sortBy = (sortBy !== 'id') && sortBy || 'rankOrder'; // Replace id by rankOrder

        const now = Date.now();
        if (this.debug) console.debug("[sample-table] Loading rows..", this.data);

        this.pmfms
            .filter(pmfms => pmfms && pmfms.length > 0)
            .first()
            .subscribe(pmfms => {
                // Transform entities into object array
                const data = this.data.map(sample => {
                    const json = sample.asObject();
                    json.measurementValues = MeasurementUtils.normalizeFormValues(sample.measurementValues, pmfms);
                    return json;
                });

                // Sort
                this.sortSamples(data, sortBy, sortDirection);
                if (this.debug) console.debug(`[sample-table] Rows loaded in ${Date.now() - now}ms`, data);

                this._dataSubject.next(data);
            });

        return this._dataSubject.asObservable();
    }

    async saveAll(data: Sample[], options?: any): Promise<Sample[]> {
        if (!this.data) throw new Error("[sample-table] Could not save table: value not set (or not started)");

        if (this.debug) console.debug("[sample-table] Updating data from rows...");

        const pmfms = this.pmfms.getValue() || [];
        this.data = data.map(json => {
            const sample = Sample.fromObject(json);
            sample.measurementValues = MeasurementUtils.toEntityValues(json.measurementValues, pmfms);
            return sample;
        });

        return this.data;
    }

    deleteAll(dataToRemove: Sample[], options?: any): Promise<any> {
        this._dirty = true;
        // Noting else to do (make no sense to delete in this.data, will be done in saveAll())
        return Promise.resolve();
    }

    addRow(): boolean {
        if (this.debug) console.debug("[survivaltest-table] Calling addRow()");

        // Create new row
        const result = super.addRow();
        if (!result) return result;

        const row = this.dataSource.getRow(-1);
        this.data.push(row.currentData);
        this.selectedRow = row;
        return true;
    }

    onTaxonGroupCellFocus(event: any, row: TableElement<any>) {
        this.startCellValueChanges('taxonGroup', row);
    }

    onTaxonGroupCellBlur(event: FocusEvent, row: TableElement<any>) {
        this.stopCellValueChanges('taxonGroup');
        // Apply last implicit value
        if (row.validator.controls.taxonGroup.hasError('entity') && this._implicitTaxonGroup) {
            row.validator.controls.taxonGroup.setValue(this._implicitTaxonGroup);
        }
        this._implicitTaxonGroup = undefined;
    }

    public trackByFn(index: number, row: TableElement<Sample>) {
        return row.currentData.rankOrder;
    }

    /* -- protected methods -- */

    protected async getMaxRankOrder(): Promise<number> {
        const rows = await this.dataSource.getRows();
        return rows.reduce((res, row) => Math.max(res, row.currentData.rankOrder || 0), 0);
    }

    protected async onNewSample(sample: Sample, rankOrder?: number): Promise<void> {
        // Set computed values
        sample.rankOrder = isNotNil(rankOrder) ? rankOrder : ((await this.getMaxRankOrder()) + 1);
        sample.label = this._acquisitionLevel + "#" + sample.rankOrder;

        // Set default values
        (this.pmfms.getValue() || [])
            .filter(pmfm => isNotNil(pmfm.defaultValue))
            .forEach(pmfm => {
                sample.measurementValues[pmfm.pmfmId] = MeasurementUtils.normalizeFormValue(pmfm.defaultValue, pmfm);
            });
    }

    protected getI18nColumnName(columnName: string): string {

        // Try to resolve PMFM column, using the cached pmfm list
        if (PMFM_ID_REGEXP.test(columnName)) {
            const pmfmId = parseInt(columnName);
            const pmfm = (this.pmfms.getValue() || []).find(p => p.pmfmId === pmfmId);
            if (pmfm) return pmfm.name;
        }

        return super.getI18nColumnName(columnName);
    }

    protected sortSamples(data: Sample[], sortBy?: string, sortDirection?: string): Sample[] {
        sortBy = (!sortBy || sortBy === 'id') ? 'rankOrder' : sortBy; // Replace id with rankOrder
        const after = (!sortDirection || sortDirection === 'asc') ? 1 : -1;
        return data.sort((a, b) => {
            const valueA = EntityUtils.getPropertyByPath(a, sortBy);
            const valueB = EntityUtils.getPropertyByPath(b, sortBy);
            return valueA === valueB ? 0 : (valueA > valueB ? after : (-1 * after));
        });
    }

    protected async refreshPmfms(event?: any): Promise<PmfmStrategy[]> {
        const candLoadPmfms = isNotNil(this._program) && isNotNil(this._acquisitionLevel);
        if (!candLoadPmfms) {
            return undefined;
        }

        this.loading = true;
        this.loadingPmfms = true;

        // Load pmfms
        const pmfms = (await this.programService.loadProgramPmfms(
            this._program,
            {
                acquisitionLevel: this._acquisitionLevel
            })) || [];

        if (!pmfms.length && this.debug) {
            console.debug(`[sample-table] No pmfm found (program=${this.program}, acquisitionLevel=${this._acquisitionLevel}). Please fill program's strategies !`);
        }

        this.loadingPmfms = false;

        this.pmfms.next(pmfms);

        return pmfms;
    }

    referentialToString = referentialToString;
    getPmfmColumnHeader = getPmfmName;
}


import { Component, Input, EventEmitter, Output } from '@angular/core';
import { PmfmStrategy, Measurement, MeasurementUtils } from "../services/trip.model";
import { Platform } from "@ionic/angular";
import { Moment } from 'moment/moment';
import { DateAdapter, FloatLabelType } from "@angular/material";
import { BehaviorSubject, Observable } from 'rxjs';
import { startWith, throttleTime } from "rxjs/operators";
import { zip } from "rxjs/observable/zip";
import { AppForm } from '../../core/core.module';
import { ProgramService } from "../../referential/referential.module";
import { FormBuilder } from '@angular/forms';
import { MeasurementsValidatorService } from '../services/measurement.validator';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { isNil, isNotNil } from 'src/app/core/services/model';

@Component({
    selector: 'form-measurements',
    templateUrl: './measurements.form.html',
    styleUrls: ['./measurements.form.scss']
})
export class MeasurementsForm extends AppForm<Measurement[]> {

    private _onValueChanged = new EventEmitter<any>();
    private _onRefreshPmfms = new EventEmitter<any>();
    private _program: string = environment.defaultProgram;
    private _gear: string;
    private _acquisitionLevel: string;
    protected data: Measurement[];
    protected _debugAcquisitionLevel: string;
    protected _onLoadingPmfms = new BehaviorSubject<boolean>(true);

    pmfms = new BehaviorSubject<PmfmStrategy[]>(undefined);
    onLoading = new BehaviorSubject<boolean>(true);

    @Input() showError: boolean = false;

    @Input() compact: boolean = false;

    @Input() floatLabel: FloatLabelType = "auto";

    @Input() requiredGear: boolean = false;

    @Output()
    valueChanges: EventEmitter<any> = new EventEmitter<any>();

    get program(): string {
        return this._program;
    }

    @Input()
    set program(value: string) {
        if (this._program === value) return; // Skip if same
        this._program = value;
        if (!this.onLoading.getValue()) {
            this._onRefreshPmfms.emit('set program');
        }
    }


    get acquisitionLevel(): string {
        return this._acquisitionLevel;
    }

    @Input()
    set acquisitionLevel(value: string) {
        if (this._acquisitionLevel == value) return; // Skip if same
        this._acquisitionLevel = value;
        if (!this.onLoading.getValue()) {
            this._onRefreshPmfms.emit('set acquisitionLevel');
        }
    }

    get gear(): string {
        return this._gear;
    }

    @Input()
    set gear(value: string) {
        if (this._gear == value) return; // Skip if same
        this._gear = value;
        if (!this.onLoading.getValue() || this.requiredGear) {
            this._onRefreshPmfms.emit('set gear');
        }
    }

    public set value(value: any) {
        this.logDebug("Set form value", value);
        if (this.data === value) return;
        // Tranform entity into json
        this.data = (value || []).map(m => {
            if (m instanceof Measurement) return m.asObject();
            return m;
        });
        this._onValueChanged.emit('set value');
    }

    public get value(): any {
        if (this.onLoading.getValue()) return this.data; // Avoid to return not loading data

        // Find dirty pmfms, to avoid full update
        const dirtyPmfms = (this.pmfms.getValue() || []).filter(pmfm => this.form.controls[pmfm.pmfmId].dirty);
        if (dirtyPmfms.length) {

            // Update measurements value
            this.logDebug("Updating form measurements...");
            const json = this.form.value;
            MeasurementUtils.updateMeasurementValues(json, this.data, dirtyPmfms);
            this.logDebug("Updating form measurements [OK]", this.data);
        }

        return this.data;
    }

    constructor(protected dateAdapter: DateAdapter<Moment>,
        protected platform: Platform,
        protected measurementValidatorService: MeasurementsValidatorService,
        protected formBuilder: FormBuilder,
        protected programService: ProgramService,
        protected translate: TranslateService
    ) {
        super(dateAdapter, platform, formBuilder.group({}));

        // TODO: DEV only
        //this.debug = true;
        //this._debugAcquisitionLevel = 'TRIP';
    }

    ngOnInit() {
        super.ngOnInit();

        this._onRefreshPmfms
            .pipe(
                startWith('ngOnInit')
            )
            .subscribe((event) => this.refreshPmfms(event));

        // Auto update the view, when value AND pmfms are filled
        zip(
            this._onValueChanged
                .pipe(
                    startWith('ngOnInit')
                )
                .filter(() => this.data && this.data.length > 0),
            this.pmfms
                .filter((pmfms) => isNotNil(pmfms))
        )
            .first()
            .subscribe(([event, pmfms]) => this.updateControls(event, pmfms));

        /*this._onMeasurementsChanged
            .pipe(
                startWith('ngOnInit')
            )
            .filter((event) => this.data && this.data.length > 0)
            .subscribe((event) => this.updateControls(event));*/

        /*this.pmfms
            .filter((pmfms) => isNotNil(pmfms) && !this.loadingPmfms)
            .pipe(
                throttleTime(100)
            )
            .subscribe((pmfms) => this.updateControls('pmfms', pmfms));*/

        // Listen form changes
        this.form.valueChanges
            .subscribe(value => {
                if (this.onLoading.getValue() || !this.valueChanges.observers.length) return; // Skip if still loading
                this.logDebug("form.valueChanges => propage event");
                this.valueChanges.emit(this.value);
            });
    }

    public markAsTouched() {
        super.markAsTouched();
        // Force each sub-controls
        (this.pmfms.getValue() || []).forEach(p => {
            const control = this.form.controls[p.pmfmId];
            if (control) control.markAsTouched();
        });
    }

    /* -- protected methods -- */

    protected logDebug(message: string, args?: any) {
        if (this.debug && (!this._debugAcquisitionLevel || (!this._acquisitionLevel || this._acquisitionLevel == this._debugAcquisitionLevel))) {
            const acquisitionLevel = this._acquisitionLevel && this._acquisitionLevel.toLowerCase().replace(/[_]/g, '-') || '?';
            if (!args) console.debug(`[meas-form-${acquisitionLevel}] ${message}`)
            else console.debug(`[meas-form-${acquisitionLevel}] ${message}`, args);
        }
    }

    protected async refreshPmfms(event): Promise<PmfmStrategy[]> {
        const candLoadPmfms = isNotNil(this._program) && isNotNil(this._acquisitionLevel) && (!this.requiredGear || isNotNil(this._gear));
        if (!candLoadPmfms) {
            return undefined;
        }

        if (event) this.logDebug(`refreshPmfms(${event})`);

        this.onLoading.next(true);
        this._onLoadingPmfms.next(true);

        // Load pmfms
        const pmfms = (await this.programService.loadProgramPmfms(
            this._program,
            {
                acquisitionLevel: this._acquisitionLevel,
                gear: this._gear
            })) || [];

        if (!pmfms.length) {
            this.logDebug(`No pmfm found (program=${this._program}, acquisitionLevel=${this._acquisitionLevel}, gear='${this._gear}'. Please fill program's strategies !`);
        }

        this.pmfms.next(pmfms);
        this._onLoadingPmfms.next(false);

        return pmfms;
    }

    public updateControls(event?: string, pmfms?: PmfmStrategy[]) {
        if (isNil(this.data)) return; // not ready
        pmfms = pmfms || this.pmfms.getValue();

        this.onLoading.next(true);

        // Waiting end of pmfm load
        if (!pmfms || this._onLoadingPmfms.getValue()) {
            this.logDebug(`updateControls(${event}): waiting pmfms...`);
            this._onLoadingPmfms
                .filter(loading => !loading)
                .pipe(
                    throttleTime(100) // groups pmfms updates event, if many updates in few duration
                )
                .first()
                .subscribe(() => {
                    this.updateControls(event);
                });
            return;
        }

        if (event) this.logDebug(`updateControls(${event})...`);

        // No pmfms (= empty form)
        if (!pmfms.length) {
            // Reset form
            this.measurementValidatorService.updateFormGroup(this.form, []);
            this.form.setValue({}, {
                onlySelf: true,
                emitEvent: false
            });
            this.onLoading.next(false);
            return true;
        }

        if (event) this.logDebug(`call _onMeasurementsChange.emit('${event}')`);
        const now = Date.now();
        this.logDebug("Updating form, using pmfms:", pmfms);

        this.measurementValidatorService.updateFormGroup(this.form, pmfms);
        const json = MeasurementUtils.toFormValues(this.data, pmfms);
        this.data = MeasurementUtils.initAllMeasurements(this.data, pmfms);
        this.form.setValue(json, {
            onlySelf: true,
            emitEvent: false
        });
        //this.form.updateValueAndValidity();

        this.logDebug(`Form updated in ${Date.now() - now}ms`, json);

        this.markAsUntouched();
        this.markAsPristine();
        this.onLoading.next(false);
        return true;
    }
}

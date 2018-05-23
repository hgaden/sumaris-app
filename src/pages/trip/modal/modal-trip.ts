import {Component, ViewChild} from '@angular/core';
import {Trip} from "../../../services/model";
import { ViewController } from "ionic-angular";
import { TripForm } from '../form/form-trip';
import { TripService } from '../../../services/trip-service';


@Component({
  selector: 'modal-trip',
  templateUrl: './modal-trip.html'
})
export class TripModal {

  loading: boolean = false;

  @ViewChild('form') private form: TripForm;

  constructor(
    private tripService: TripService,
    private viewCtrl: ViewController) {
  }

  onSave(json: any): Promise<any> {

    // Avoid multiple call    
    if (this.form.form.disabled) return;
    this.form.disable();

    let data = new Trip();
    data.fromObject(json);

    return this.tripService.save(data)
      .then((res) => this.viewCtrl.dismiss(res))
      .catch(err => {
        this.form.error = err && err.message || err;
        this.form.enable();
      });
  }

  cancel() {
    this.viewCtrl.dismiss();
  }
}
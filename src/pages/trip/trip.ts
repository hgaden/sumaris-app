import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { TripService } from '../../services/trip-service';
import { TripForm } from './form/form-trip';
import { Trip } from '../../services/model';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'page-trip',
  templateUrl: './trip.html'
})
export class TripPage implements OnInit{

  loading: boolean = true;
  data: Trip;

  @ViewChild('form') private form: TripForm;

  constructor(
    private route: ActivatedRoute, 
    private tripService: TripService
    //private router: Router
  ) {
  }

  ngOnInit() {
    // Make sure template has a form
    if (!this.form) throw "[TripPage] no form for value setting";

    this.route.params.subscribe(res => {
        this.load(parseInt(res["id"]));
    });
  }

  load(id: number) {
    this.tripService.load(id)
      .then(trip => {
        this.updateView(trip);
        this.loading = false;
      });
  }

  updateView(data: Trip|null) {
    this.form.setValue(data);
    this.data = data;
  }

  save(event, json): Promise<any> {
    if (this.loading) return;

    // Update Trip from JSON
    this.data.fromObject(json);

    return this.tripService.save(this.data)
      .then((data) => {
        this.updateView(data);
        this.form.markAsPristine();
      });
  }


}

import { Component, EventEmitter, Output, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import { RegisterModal } from '../../register/modal/modal-register';
import { AuthData } from "../../services/account.service";
import { environment } from "../../../../environments/environment";


@Component({
  selector: 'form-auth',
  templateUrl: 'form-auth.html',
  styleUrls: ['./form-auth.scss']

})
export class AuthForm implements OnInit {

  public loading: boolean = false;
  public form: FormGroup;
  public error: string = null;

  public get value(): AuthData {
    return this.form.value;
  }

  public get valid(): boolean {
    return this.form.valid;
  }

  public get invalid(): boolean {
    return this.form.invalid;
  }

  @Output()
  onCancel: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  onSubmit: EventEmitter<AuthData> = new EventEmitter<AuthData>();

  constructor(public formBuilder: FormBuilder,
    public modalCtrl: ModalController) {
    this.form = formBuilder.group({
      username: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.required]
    });

  }


  ngOnInit() {
    // For DEV only
    if (environment.production === false) {
      this.form.setValue({
        username: 'benoit.lavenier@e-is.pro',
        password: 'priezPourMoi!'
      });
    }
  }

  cancel() {
    this.onCancel.emit();
  }

  doSubmit(event: any, data: any) {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = null;
    this.onSubmit
      .subscribe(res => {
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });

    setTimeout(() => this.onSubmit.emit({
      username: data.username,
      password: data.password
    }));
  }

  register() {
    this.onCancel.emit();
    setTimeout(async () => {
      const modal = await this.modalCtrl.create({
        component: RegisterModal
      });
      modal.present();
    });
  }
}

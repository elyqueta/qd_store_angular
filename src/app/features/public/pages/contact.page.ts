import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'qd-contact-page',
  imports: [TranslocoPipe],
  templateUrl: './contact.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {}

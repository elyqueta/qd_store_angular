import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme/theme.service';
import { ToastRegionComponent } from './shared/ui/toast-region.component';

@Component({
  selector: 'qd-root',
  imports: [RouterOutlet, ToastRegionComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly i18nService = inject(I18nService);
  private readonly themeService = inject(ThemeService);
}

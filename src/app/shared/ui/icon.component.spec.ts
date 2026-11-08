import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  it('renders every icon name currently returned by the API catalog', async () => {
    await TestBed.configureTestingModule({ imports: [IconComponent] }).compileComponents();
    const fixture = TestBed.createComponent(IconComponent);
    const catalogNames = [
      'laptop',
      'mobile-screen',
      'headphones',
      'desktop',
      'gamepad',
      'bolt',
      'screwdriver-wrench',
      'keyboard',
      'mouse',
      'print',
      'wifi',
      'memory',
      'microchip',
      'camera',
      'usb',
      'brands/whatsapp',
    ];

    for (const name of catalogNames) {
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
      expect(svg.getAttribute('viewBox')).not.toBeNull();
      expect(svg.querySelector('path')?.getAttribute('d')).toBeTruthy();
    }
  });

  it('renders the neutral fallback for an icon name it cannot render', async () => {
    await TestBed.configureTestingModule({ imports: [IconComponent] }).compileComponents();
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'icon-added-by-a-new-api-version');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 448 512');
    expect(svg.querySelector('path')?.getAttribute('d')).toContain('M50.7');
  });
});

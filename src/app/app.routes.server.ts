import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'entrar',
    renderMode: RenderMode.Client,
  },
  {
    path: 'criar-conta',
    renderMode: RenderMode.Client,
  },
  {
    path: 'conta/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'produtos',
    renderMode: RenderMode.Server,
  },
  {
    path: 'produtos/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'sobre',
    renderMode: RenderMode.Server,
  },
  {
    path: 'contactos',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];

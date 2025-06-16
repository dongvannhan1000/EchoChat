import { Application, Router } from 'express';

function listRoutes(appOrRouter: Application | Router, basePath = '') {
  const routes: string[] = [];

  const stack = ((appOrRouter as any)._router?.stack || (appOrRouter as any).stack || []);

  for (const layer of stack) {
    if (layer.route) {
      const path = basePath + layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .map(method => method.toUpperCase())
        .join(', ');
      routes.push(`[${methods}] ${path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      const subPath = layer.regexp?.source
        ?.replace('^\\', '')
        ?.replace('\\/?(?=\\/|$)', '')
        ?.replace(/\\\//g, '/')
        ?.replace(/\$$/, '') || '';
      const nestedBase = basePath + (subPath !== '/' ? `/${subPath}` : '');
      routes.push(...listRoutes(layer.handle, nestedBase));
    }
  }

  return routes;
}

export function logRoutes(app: Application) {
  const routes = listRoutes(app);
  console.log('\n🛣️ Registered Routes:');
  for (const route of routes) {
    console.log('  ' + route);
  }
}

import { SetupServerApi } from 'msw/node';

declare global {
  var mswServer: SetupServerApi;
  namespace NodeJS {
    interface Global {
      mswServer: SetupServerApi;
    }
  }
}

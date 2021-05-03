import * as restify from 'restify';
import * as mongoose from 'mongoose';
import { environment } from '../common/environment';
import { Router } from '../common/router';
import {mergePatchBodyParser} from './merge-patch.parser';
import { handleError } from './error.handler';

export class Server {
  application: restify.Server;

  initializeDb() {
    (<any>mongoose).Promise = global.Promise
    return mongoose.connect(environment.db.url, {
      useMongoClient: true
    })
  }

  initRoutes(routers: Router[]): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.application = restify.createServer({
          name: 'meat-api',
          version: '1.0.0'
        })

        this.application.use(restify.plugins.queryParser());
        this.application.use(restify.plugins.bodyParser());
        this.application.use(mergePatchBodyParser);


        // inicializando as rotas
        for(let router of routers) {
          router.applyRoutes(this.application);
        }

        this.application.listen(environment.server.port, () => {
          resolve(this.application);
        });

        this.application.on('restifyError', handleError);

      } catch(error) {
        reject(error);
      }
    })
  }

  bootstrap(routers: Router[] = []): Promise<Server>{
    return this.initializeDb().then(() =>
      this.initRoutes(routers).then(() => this))
  }

}

// next - função que é chamada em 3 situações;
// 1 - Quando queremos indicar que o callback terminou
// 2 - Quando há mais de um fluxo de callback para uma rota
// 3 - Quando é necessário passar objeto de erro

// STATUS
// 200 - Ok; 201 - Criado; 202 - Assíncrono; 204 - Sem conteúdo
// 30x - Redirecionamento de conteúdo
// 400 - Erro na requisição; 401 - Não Autorizado; 403 - Proibido; 404 - Não encontrado
// 50X - Erro Interno do servidor

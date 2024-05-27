import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // usando o global não preciso importar mais em nenhum modulo para poder usar
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
    //pra usar a dependency injection diretamente em outro service de outro module, é preciso exportar o service no modulo
})
export class PrismaModule {}

import connection from '../config/sequelize-config.js'

// importa todas as models
import Usuario from './Usuario.js'
import Analise from './Analise.js'
import Imagem from './Imagem.js'
import Processada from './Processada.js'
import Classificacao from './Classificacao.js'

// define relacionamentos

/* 
    USUÁRIO 1-N ANALISE 
*/
Usuario.hasMany(Analise, {
    foreignKey: 'id_usuario',
    as: 'analise'
})

Analise.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
    onDelete: 'CASCADE'
})

/* 
    ANALISE 1-N IMAGEM 
*/
Analise.hasMany(Imagem, {
    foreignKey: 'id_analise',
    as: 'imagem'
})

Imagem.belongsTo(Analise, {
    foreignKey: 'id_analise',
    as: 'analise',
    onDelete: 'CASCADE'
})

/* 
    IMAGEM 1-N PROCESSADA 
*/
Imagem.hasMany(Processada, {
    foreignKey: 'id_imagem',
    as: 'processada'
})

Processada.belongsTo(Imagem, {
    foreignKey: 'id_imagem',
    as: 'imagem',
    onDelete: 'CASCADE'
})

/* 
    ANALISE 1-1 CLASSIFICACAO 
*/
Analise.hasOne(Classificacao, {
    foreignKey: 'id_analise',
    as: 'classificacao'
})

Classificacao.belongsTo(Analise, {
    foreignKey: 'id_analise',
    as: 'analise',
    onDelete: 'CASCADE'
})

export {
    connection,
    Usuario,
    Analise,
    Imagem,
    Processada,
    Classificacao
}
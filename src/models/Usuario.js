import connection from '../config/sequelize-config.js'
import { DataTypes } from 'sequelize'

const Usuario = connection.define('usuarios', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telefone: {
        type: DataTypes.STRING,
    },
    data_nascimento: {
        type: DataTypes.DATE
    },
    tipo_acesso: {
        type: DataTypes.ENUM('produtor', 'estudante'),
        defaultValue: 'produtor',
        allowNull: false
    },
    endereco: {
        type: DataTypes.STRING
    },
    cnpj: {
        type: DataTypes.STRING
    },
    faculdade: {
        type: DataTypes.STRING
    },
    curso: {
        type: DataTypes.STRING
    }
},
    {
        tableName: 'usuarios',
        timestamps: true,
        paranoid: true,
        indexes: [{
            // cria índice único composto para permitir recadastro de e-mail após deleção lógica
            // se (email, deletedAt = null), acha e não permite recadastro
            // se (email, deletedAt = timestamp), não acha e permite recadastro   
            unique: true,
            fields: ['email', 'deletedAt']
        }]
    }
)

export default Usuario
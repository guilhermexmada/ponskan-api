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
        allowNull: false
    },
    senha: {
        type: DataTypes.STRING,
        unique: true,
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
        type: DataTypes.INTEGER
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
        timestamps: true
    }
)

export default Usuario
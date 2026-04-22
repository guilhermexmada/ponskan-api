import connection from '../config/sequelize-config.js'
import { DataTypes } from 'sequelize'

const Classificacao = connection.define('classificacoes', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    tempo_execucao: {
        type: DataTypes.INTEGER,
    },
    classe:{
        type: DataTypes.STRING,
        allowNull: false
    },
    confianca: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    modelo_cnn: {
        type: DataTypes.STRING,
        allowNull: false
    }
},
    {
        tableName: 'classificacoes',
        timestamps: true
    }
)

export default Classificacao
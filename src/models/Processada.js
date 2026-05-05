import connection from '../config/sequelize-config.js'
import { DataTypes } from 'sequelize'

const Processada = connection.define('processadas', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    id_imagem: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'imagens',
            key: 'id'
        }
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    caminho: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_mime: {
        type: DataTypes.ENUM(
            'image/jpeg',
            'image/jpg',
            'image/png'
        ),
        allowNull: false,
    },
    tamanho: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    }
},
    {
        tableName: 'processadas',
        timestamps: true
    }
)

export default Processada
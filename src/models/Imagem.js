import connection from '../config/sequelize-config.js'
import { DataTypes } from 'sequelize'

const Imagem = connection.define('imagens', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    caminho: {
        type: DataTypes.STRING,
        allowNull: false
    },
    coordenadas: {
        type: DataTypes.GEOMETRY('POINT'),
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
        tableName: 'imagens',
        timestamps: true
    }
)

export default Imagem
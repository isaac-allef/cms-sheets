import { GoogleSpreadsheet } from 'google-spreadsheet';
import Sheet from '../models/Sheet';
import AddRowSheetService from '../services/AddRowSheetService';
import AuthDocService from '../services/AuthDocService';
import DeleteRowSheetService from '../services/DeleteRowSheetService';
import ReadSheetService from '../services/ReadSheetService';
import WriteSheetService from '../services/WriteSheetService';


interface dropRequest {
    sheetIndex: number; 
    rowIndex: number;
}

interface addRequest {
    sheetIndex: number;
    rowValues: Array<(
        | {
            [header: string]: string | number | boolean;
        }
        | Array<string | number | boolean>
    )>,
}

interface ColumnsValues {
    column: string;
    value: string;
}

interface alterRequest {
    sheetIndex: number; 
    rowIndex: number;
    columnsValues: Array<ColumnsValues>;
}

interface authRequest {
    doc: GoogleSpreadsheet;

    auth: authData;
}

interface authData {
    client_email: string;
    
    private_key: string;
}

interface requestDTO {
    sheetId: string;
    
    auth: authData;
}

class SheetRepository {

    doc: GoogleSpreadsheet;

    constructor({ sheetId, auth }: requestDTO) {
        this.doc = new GoogleSpreadsheet(sheetId);
        this.authentication({ doc: this.doc, auth });
    }

    private async authentication({ doc, auth }: authRequest) {
        const authService = new AuthDocService();
        await authService.execute({ doc, auth });
    }

    public async all(): Promise<Sheet[]> {
        await this.doc.loadInfo();
        const sheetCount = this.doc.sheetCount;
        const sheets = [];

        for (let i=0; i<sheetCount; i++) {
            const sheet = await this.find(i);
            sheets.push(sheet);
        }

        return sheets;
    }

    public async find(sheetIndex: number): Promise<Sheet> {
        const reader = new ReadSheetService();

        const data = await reader.execute({ doc: this.doc, sheetIndex });

        const sheet = new Sheet({ index: sheetIndex, data });

        return sheet;
    }

    public async add({ sheetIndex, rowValues }: addRequest) {
        const adder = new AddRowSheetService();

        const rows = await adder.execute({ doc: this.doc, 
            sheetIndex, 
            rowValues,
        });

        return rows;
    }

    public async drop({ sheetIndex, rowIndex }: dropRequest) {
        const deleter = new DeleteRowSheetService();

        const row = await deleter.execute({ doc: this.doc, 
            sheetIndex, 
            rowIndex, 
        });

        return row;
    }

    public async alter({ sheetIndex, rowIndex, columnsValues }: alterRequest) {
        const writer = new WriteSheetService();

        const row = await writer.execute({ doc: this.doc, 
            sheetIndex, 
            rowIndex, 
            columnsValues 
        });

        return row;
    }
}

export default SheetRepository;
import Database from '../src/DatabaseWrapper';
import * as assert from 'assert';
import * as dbCredentials from './secret.json';

async function main() {
    const db = new Database(dbCredentials);
    
    try {
        const clients = await db.query("select emr_client_id,ecl_name from emr_client limit 3").fetchAll();
        console.log(clients);

        const fileNo = await db.query("select ecl_file_no from emr_client where emr_client_id=?",[clients[0].emr_client_id]).fetchValue();
        console.log(fileNo);

        const dobs = await db.query("select ecl_birth_date from emr_client where nullif(ecl_birth_date,0) is not null limit 3").fetchColumn();
        console.log(dobs);

        const idNameMap = await db.query("select emr_client_id,ecl_name from emr_client limit 3").fetchPairs();
        console.log(idNameMap);

        const someClient = await db.query("select emr_client_id,ecl_name,ecl_birth_date from emr_client where ecl_first_name=:fname and ecl_last_name=:lname", {
            fname: 'ALBERTSON',
            lname: 'AARSENX'
        }).fetchRow();
        console.log(someClient);
        
        const statsStream = db.stream("select emr_stats_item_value_id, siv_data, siv_value from emr_stats_item_value"); // lots of records! let's stream them.
        for await(const row of statsStream) {
            process.stdout.write(`\r${row.emr_stats_item_value_id} ${row.siv_data||row.siv_value}`);
        }
        console.log();
        
        const ins = await db.exec("insert into _mysql3_test (`str`,`int`) values ?", [[["foo",1],["bar",2],["baz",3]]]);
        assert(ins.affectedRows === 3);
        const ins2 = await db.exec("insert into _mysql3_test (`str`,`int`) values (:v1),(:v2)", {
            v1: ['beta',4],
            v2: ['gamma',5],
        });
        assert(ins2.affectedRows === 2);
        
        const del = await db.exec("delete from _mysql3_test");
        assert(del.affectedRows === 5);
    } finally {
        db.close();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
#!/usr/bin/env /data/conda-marshmallow/bin/python

import web
import pandas as pd
import cgi

DB_USER = os.getenv("MARIADB_USER")
DB_PASS = os.getenv("MARIADB_PASSWORD")
DB_NAME = os.getenv("MARIADB_DATABASE")

db = web.database(dbn='mysql',
                  host="db",
                  user=DB_USER,
                  passwd=DB_PASS,
                  db=DB_NAME)

res = db.select('enrichment_pred_het', where='Source="HGMD"', what='Disease').list()
r1 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_het', where='Source="HGMD"', what='Disease').list()
r2 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_pred_homo', where='Source="HGMD"', what='Disease').list()
r3 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_homo', where='Source="HGMD"', what='Disease').list()
r4 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
db.ctx.db.close()

result = pd.concat([r1, r2, r3, r4], ignore_index=True).drop_duplicates().sort_values(by='Disease')

template = "<option value='{0}'>{0}</option>"

with open('hgmd.html', 'w') as f:
    for i in result.values.flatten():
        f.write(template.format(cgi.escape(i, quote=True).encode('utf-8')) + '\n')


db = web.database(dbn='mysql',
                  host="db",
                  user=DB_USER,
                  passwd=DB_PASS,
                  db=DB_NAME)

res = db.select('enrichment_pred_het', where='Source="ClinVar"', what='Disease').list()
r1 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_het', where='Source="ClinVar"', what='Disease').list()
r2 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_pred_homo', where='Source="ClinVar"', what='Disease').list()
r3 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_homo', where='Source="ClinVar"', what='Disease').list()
r4 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
db.ctx.db.close()

result = pd.concat([r1, r2, r3, r4], ignore_index=True).drop_duplicates().sort_values(by='Disease')

template = "<option value='{0}'>{0}</option>"

with open('clinvar.html', 'w') as f:
    for i in result.values.flatten():
        f.write(template.format(cgi.escape(i, quote=True).encode('utf-8')) + '\n')


db = web.database(dbn='mysql',
                  host="db",
                  user=DB_USER,
                  passwd=DB_PASS,
                  db=DB_NAME)

res = db.select('enrichment_pred_het', where='Source="COSMIC"', what='Disease').list()
r1 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_het', where='Source="COSMIC"', what='Disease').list()
r2 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_pred_homo', where='Source="COSMIC"', what='Disease').list()
r3 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
res = db.select('enrichment_struct_homo', where='Source="COSMIC"', what='Disease').list()
r4 = pd.DataFrame(dict(r) for r in res)[['Disease']].drop_duplicates().sort_values(by='Disease')
db.ctx.db.close()

result = pd.concat([r1, r2, r3, r4], ignore_index=True).drop_duplicates().sort_values(by='Disease')

template = "<option value='{0}'>{0}</option>"

with open('cosmic.html', 'w') as f:
    for i in result.values.flatten():
        f.write(template.format(cgi.escape(i, quote=True).encode('utf-8')) + '\n')

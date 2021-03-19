// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const electron = require('electron');
const {
    ipcMain
} = require('electron');
const func = require('./func');
const genbankToJson = require('bio-parsers').genbankToJson;
const fastaToJson = require('bio-parsers').fastaToJson;
const jsonfile = require('jsonfile');
const fs = require('fs');
var exec = require('sync-exec');
var os = require("os");


const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;

let mainWindow = null;

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        }
    });
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(`file://${app.getAppPath()}/index.html`);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // a = jsonfile.readFileSync('offtarget_info/tigr7_20_YG_ETScodon_gRNA_m3_offtarget.json');
    

});


ipcMain.on('get_app_path', function (event, data) {
    event.sender.send('send_app_path', app.getAppPath());
 });


options = {
    fileName: 'genbank_file',
    iszProtein: false,
    inclusive1BasedStart: false,
    inclusive1BasedEnd: false,
};

var dna, dna_com, cds_info = [],
    grna_info, editor_info = [],
    tem_dna, tem_cds, info = {
        'all_info': [],
        'category': ['protein', 'CDS', 'DNA'],
        'dna_len': 0
    };
var info_r = {
        'all_info': [],
        'category': ['protein', 'CDS', 'DNA'],
        'dna_len': 0
    },
    overlap_info, optimize_info;
var output_info = [];


ipcMain.on('sent_gb', function (event, data) {
    try {
        genbankToJson(data, function (result) {

            if (result[0]['parsedSequence']['features'].length == 0) {
                event.sender.send('no_feature_err')
            }

            // 判断gb文件有多少isform
            var cds_num = 0;
            for (var i = 0; i < result[0]['parsedSequence']['features'].length; i++) {
                if (result[0]['parsedSequence']['features'][i]['type'] === 'CDS') {
                    cds_num++
                }
            }

            // 获得dna序列及长度
            dna = result[0]['parsedSequence']['sequence'].toUpperCase();
            dna_com = func.reverse_complement(dna, false, true);
            info.dna_len = dna.length;
            // info_r.dna_len = dna.length;

            // 将所有cds信息保存到cds_info中
            cds_info = [];
            for (let i = 0; i < result[0]['parsedSequence']['features'].length; i++) {
                if (result[0]['parsedSequence']['features'][i]['type'] === 'CDS') {
                    if (result[0]['parsedSequence']['features'][i].hasOwnProperty("locations")) {
                        cds_info.push({
                            'locations': result[0]['parsedSequence']['features'][i]['locations'],
                            'translation': result[0]['parsedSequence']['features'][i]['notes']['translation'][0]
                        })
                    } else {
                        cds_info.push({
                            'locations': [{
                                'start': result[0]['parsedSequence']['features'][i]['start'],
                                'end': result[0]['parsedSequence']['features'][i]['end']
                            }],
                            'translation': result[0]['parsedSequence']['features'][i]['notes']['translation'][0]
                        })
                    }


                }
            }

            // 将isform数量传递给客户端
            event.sender.send('append_isoform', cds_num)
        }, options);
    } catch (error) {
        event.sender.send('gb_err')
    }

});

ipcMain.on('sent_sg', function (event, data) {


    // 获得dna序列及长度
    dna = data[0]['parsedSequence']['sequence'].toUpperCase();
    // dna_com = func.reverse_complement(dna, false, true);
    info.dna_len = dna.length;
    // info_r.dna_len = dna.length;

    // 将所有cds信息保存到cds_info中
    cds_info = []
    for (let i in data[0]['parsedSequence']['features']) {
        var location_info = [];
        if (data[0]['parsedSequence']['features'][i]['type'] === 'CDS') {
            for (let k in data[0]['parsedSequence']['features'][i]['segments']) {
                if (data[0]['parsedSequence']['features'][i]['segments'][k]['translated']) {
                    location_info.push({
                        'start': data[0]['parsedSequence']['features'][i]['segments'][k]['start'],
                        'end': data[0]['parsedSequence']['features'][i]['segments'][k]['end']
                    })
                }
            }
            var cds_tem = '';
            for (let y in location_info) {
                cds_tem += dna.slice(location_info[y]['start'], location_info[y]['end'] + 1)
            }

            var protein_tem = func.translate(cds_tem).protein1;
            cds_info.push({
                'locations': location_info,
                'translation': protein_tem.slice(0, protein_tem.length - 1)
            })
        }
    }


});


ipcMain.on('sent_dna_fa', function (event, data) {
    try {
        event.sender.send('test');
        fastaToJson(data, function (result) {

            // 获得dna序列及长度
            dna = result[0]['parsedSequence']['sequence'].toUpperCase();
            dna_com = func.reverse_complement(dna, false, true);
            info.dna_len = dna.length;
            // info_r.dna_len = dna.length;

        }, options);
    } catch (error) {
        event.sender.send('gb_err')
    }
});


ipcMain.on('sent_cds_fa', function (event, data) {
    try {
        fastaToJson(data, function (result) {

            // 获得cds序列及长度
            tem_cds = result[0]['parsedSequence']['sequence'].toUpperCase();
            fs.writeFileSync(app.getAppPath() + '/cds.fa', '>cds\n' + tem_cds, 'utf8');
        }, options);
    } catch (error) {
        event.sender.send('gb_err')
    }

});


ipcMain.on('analyse', function (event, data) {

    var cds = '';

    // 当输入dna和cds序列的时候执行

    if (os.platform() === 'darwin') {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_macos/bin/')
    } else if (os.platform() === 'win32') {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_win/bin/')
    } else {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_linux/bin/')
    }

    //    var blastPath = fs.realpathSync('./exonerate/exonerate_macos/bin/');


    if (data.FA) {
        if (data.DS && data.CS) {
            dna = data.dna_sequence;
            dna_com = func.reverse_complement(dna, false, true);
            info.dna_len = dna.length;
            tem_dna = '>dna\n' + dna;
            tem_cds = '>cds\n' + data.cds_sequence;
            fs.writeFileSync(app.getAppPath() + '/dna.fa', tem_dna, 'utf8');
            fs.writeFileSync(app.getAppPath() + '/cds.fa', tem_cds, 'utf8');

        } else {
            tem_dna = '>dna\n' + dna;
            fs.writeFileSync(app.getAppPath() + '/dna.fa', tem_dna, 'utf8');
        }

        var query_result = exec(blastPath + '/exonerate --model est2genome ' + app.getAppPath() + '/cds.fa ' + app.getAppPath() + '/dna.fa --bestn 1 --showquerygff -S false').stdout;

        var tem_info = [];
        var threshold = -1;
        for (let i in query_result.split(';')) {
            if (func.trim(query_result.split(';')[i]).split(' ')[0] === "Align") {
                var start = Number(func.trim(query_result.split(';')[i]).split(' ')[2]);
                if (start > threshold) {
                    threshold = start
                } else {
                    break
                }
                var span_len = Number(func.trim(query_result.split(';')[i]).split(' ')[3]);
                var end = start + span_len - 1;
                tem_info.push({
                    'start': start - 1,
                    'end': end - 1
                })
            }
        }
        

        if (data.DS && data.CS) {
            cds_info[0] = {
                'locations': tem_info,
                'translation': func.translate(data.cds_sequence).protein1
            };
        } else {
            cds_info[0] = {
                'locations': tem_info,
                'translation': func.translate(tem_cds).protein1
            };
        }


        for (let i = 0; i < dna.length; i++) {
            if (dna[i] === 'A') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'T') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'C') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'G') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            }
        }

        // for (let i=0; i<dna_com.length; i++){
        //     if (dna_com[i] === 'A'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#4EEE94"])
        //     }
        //     else if (dna_com[i] === 'T'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#EE6363"])
        //     }
        //     else if (dna_com[i] === 'C'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#4682B4"])
        //     }
        //     else if (dna_com[i] === 'G'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#696969"])
        //     }
        // }

        for (let i = 0; i < cds_info[0]['locations'].length; i++) {
            let start = cds_info[0]['locations'][i]['start'];
            let end = cds_info[0]['locations'][i]['end'] + 1;
            cds += dna.slice(start, end);
            cds_info[0]['locations'][i]['marker'] = cds.length;
            if (i === 0) {
                cds_info[0]['locations'][i]['reminder'] = cds_info[0]['locations'][i]['marker'] % 3
            } else {
                if (Number(cds_info[0]['locations'][i - 1]['reminder']) !== 0) {

                    cds_info[0]['locations'][i]['reminder'] = (cds_info[0]['locations'][i]['marker'] -
                        cds_info[0]['locations'][i - 1]['marker'] - (3 - cds_info[0]['locations'][i - 1]['reminder'])) % 3
                } else {
                    cds_info[0]['locations'][i]['reminder'] = (cds_info[0]['locations'][i]['marker'] -
                        cds_info[0]['locations'][i - 1]['marker']) % 3
                }
            }

            info.all_info.push(['CDS', start, end, "CDS" + (i + 1), '#8AAAE5']);
            // info_r.all_info.push(['CDS', start, end, "CDS"+(i+1), '#8AAAE5'])
        }


        //        添加intron注释
        //        for (let i in cds_info[0]['locations']){
        //
        //            if (i==0){
        //                info.all_info.push(['CDS', 0, cds_info[0]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //            }
        //
        //            else if(i==cds_info[0]['locations'].length-1){
        //                info.all_info.push(['CDS', cds_info[0]['locations'][i-1]['end']+1, cds_info[0]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //                info.all_info.push(['CDS', cds_info[0]['locations'][i]['end']+1, dna.length, "intron"+(Number(i)+2), '#959ca3']);
        //            }
        //
        //            else {
        //                info.all_info.push(['CDS', cds_info[0]['locations'][i-1]['end']+1, cds_info[0]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //            }
        //        }

        var cds_protein = cds_info[0]['translation'];

        for (let i = 0; i < cds_protein.length; i++) {
            for (let k in cds_info[0]['locations']) {
                if (Number(k) === 0) {
                    if (i * 3 >= 0 && i * 3 <= cds_info[0]['locations'][k]['marker'] - 1) {
                        if (i % 2 === 0) {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#4EEE94']);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#FF4040'])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#6b6b6b'])
                            }
                        } else {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#4EEE94']);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#FF4040'])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'], 3 * i + 3 + cds_info[0]['locations'][k]['start'], cds_protein[i], '#bababa'])
                            }
                        }
                        break
                    }
                } else {
                    if (i * 3 >= cds_info[0]['locations'][k - 1]['marker'] && i * 3 <= cds_info[0]['locations'][k]['marker'] - 1) {

                        if (i % 2 === 0) {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#4EEE94'
                                ]);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#FF4040'
                                ])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#6b6b6b'
                                ])
                            }
                        } else {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#4EEE94'
                                ]);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#FF4040'
                                ])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[0]['locations'][k]['start'] - cds_info[0]['locations'][k - 1]['marker'], cds_protein[i], '#bababa'
                                ])
                            }
                        }

                        break
                    }
                }
            }
        }


        codon_info = func.find_codon(cds, cds_info, 0);

    }

    // 输入GenBank或snapgene格式的
    else {

        for (let i = 0; i < dna.length; i++) {
            if (dna[i] === 'A') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'T') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'C') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            } else if (dna[i] === 'G') {
                info.all_info.push(['DNA', i, i + 1, dna[i], "#c5cfd8"])
            }
        }

        // for (let i=0; i<dna_com.length; i++){
        //     if (dna_com[i] === 'A'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#4EEE94"])
        //     }
        //     else if (dna_com[i] === 'T'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#EE6363"])
        //     }
        //     else if (dna_com[i] === 'C'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#4682B4"])
        //     }
        //     else if (dna_com[i] === 'G'){
        //         info_r.all_info.push(['-', i, i+1, dna_com[i], "#696969"])
        //     }
        // }

        // 不加varcds=“”会出现cds未定义
        var cds = '';
        for (let i = 0; i < cds_info[data.isform - 1]['locations'].length; i++) {
            let start = cds_info[data.isform - 1]['locations'][i]['start'];
            let end = cds_info[data.isform - 1]['locations'][i]['end'] + 1;
            cds += dna.slice(start, end);
            cds_info[data.isform - 1]['locations'][i]['marker'] = cds.length;
            if (i === 0) {
                cds_info[data.isform - 1]['locations'][i]['reminder'] = cds_info[data.isform - 1]['locations'][i]['marker'] % 3
            } else {
                if (Number(cds_info[data.isform - 1]['locations'][i - 1]['reminder']) !== 0) {

                    cds_info[data.isform - 1]['locations'][i]['reminder'] = (cds_info[data.isform - 1]['locations'][i]['marker'] -
                        cds_info[data.isform - 1]['locations'][i - 1]['marker'] - (3 - cds_info[data.isform - 1]['locations'][i - 1]['reminder'])) % 3
                } else {
                    cds_info[data.isform - 1]['locations'][i]['reminder'] = (cds_info[data.isform - 1]['locations'][i]['marker'] -
                        cds_info[data.isform - 1]['locations'][i - 1]['marker']) % 3
                }
            }

            info.all_info.push(['CDS', start, end, "CDS" + (i + 1), '#8AAAE5']);
            // info_r.all_info.push(['CDS', start, end, "CDS"+(i+1), '#8AAAE5'])
        }

        //        添加intron注释
        //        for (let i in cds_info[data.isform-1]['locations']){
        //
        //            if (i==0){
        //                info.all_info.push(['CDS', 0, cds_info[data.isform-1]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //            }
        //
        //            else if(i==cds_info[data.isform-1]['locations'].length-1){
        //                info.all_info.push(['CDS', cds_info[data.isform-1]['locations'][i-1]['end']+1, cds_info[data.isform-1]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //                info.all_info.push(['CDS', cds_info[data.isform-1]['locations'][i]['end']+1, dna.length, "intron"+(Number(i)+2), '#959ca3']);
        //            }
        //
        //            else {
        //                info.all_info.push(['CDS', cds_info[data.isform-1]['locations'][i-1]['end']+1, cds_info[data.isform-1]['locations'][i]['start'], "intron"+(Number(i)+1), '#959ca3']);
        //            }
        //        }


        var cds_protein = cds_info[data.isform - 1]['translation'] + '*';


        for (let i = 0; i < cds_protein.length; i++) {
            for (let k in cds_info[data.isform - 1]['locations']) {
                if (Number(k) === 0) {
                    if (i * 3 >= 0 && i * 3 <= cds_info[data.isform - 1]['locations'][k]['marker'] - 1) {
                        if (i % 2 === 0) {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#4EEE94']);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#FF4040'])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#6b6b6b'])
                            }
                        } else {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#4EEE94']);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#FF4040'])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'], 3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'], cds_protein[i], '#bababa'])
                            }
                        }
                        break
                    }
                } else {
                    if (i * 3 >= cds_info[data.isform - 1]['locations'][k - 1]['marker'] && i * 3 <= cds_info[data.isform - 1]['locations'][k]['marker'] - 1) {

                        if (i % 2 === 0) {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#4EEE94'
                                ]);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#FF4040'
                                ])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#6b6b6b'
                                ])
                            }
                        } else {
                            if (cds_protein[i] === 'M') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#4EEE94'
                                ]);
                            } else if (cds_protein[i] === '*') {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#FF4040'
                                ])
                            } else {
                                info.all_info.push(['protein', 3 * i + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'],
                                    3 * i + 3 + cds_info[data.isform - 1]['locations'][k]['start'] - cds_info[data.isform - 1]['locations'][k - 1]['marker'], cds_protein[i], '#bababa'
                                ])
                            }
                        }

                        break
                    }
                }
            }
        }

        // 寻找codon并添加到信息列表中
        codon_info = func.find_codon(cds, cds_info, data.isform - 1);
        // console.log(codon_info)
    }


    //    if (data.pam === 'NGG'){
    //        grna_info = func.find_grna(dna, data.pam, data.grna_length, false);
    //        console.log(grna_info)
    //        console.log(data.pam)
    //        overlap_info = func.overlap(codon_info, grna_info, false);
    //        editor_info = jsonfile.readFileSync('statics/editor_cas9.json');
    //    }else  if (data.pam === 'TTTV'){
    //        grna_info = func.find_grna(dna, data.pam, data.grna_length, true);
    //        overlap_info = func.overlap(codon_info, grna_info, true);
    //        editor_info = jsonfile.readFileSync('statics/editor_cpf1.json');
    //    }

    //  寻找DNA上的gRNA，返回grna_info
    grna_info = func.find_grna(dna, data.pam, data.grna_length, false);

    
    overlap_info = func.overlap(codon_info, grna_info, false);
    console.log(overlap_info)
    //    editor_info = jsonfile.readFileSync('statics/editor_cas9.json');


    // 先把overlap_info转成json文件再读取信息不然会出现莫名其妙的bug
    //    jsonfile.writeFileSync('overlap_info.json', overlap_info);
    //    overlap_info = jsonfile.readFileSync('overlap_info.json');



    // 下面几行纠正一些overlap_info中的错误
    //    if (data.pam ==='TTTV'){
    //        for (let i in overlap_info){
    //            for (let k in overlap_info[i]){
    //                if (k !== 'codon'){
    //                    if (overlap_info[i][k][3] === '+'){
    //                        overlap_info[i][k][4] = overlap_info[i][k][2] - overlap_info[i]['codon'][1]
    //                    }
    //                    else {
    //                        overlap_info[i][k][4] = [overlap_info[i]['codon'][2]-overlap_info[i][k][1], overlap_info[i]['codon'][2]-overlap_info[i][k][1]+1];
    //                    }
    //                }
    //            }
    //        }
    //    }

    //    if (data.pam ==='NGG'){
    //        for (let i in overlap_info){
    //            for (let k in overlap_info[i]){
    //                if (k !== 'codon'){
    //                    if (overlap_info[i][k][3] === '+'){
    //                        overlap_info[i][k][4] = overlap_info[i]['codon'][1] - overlap_info[i][k][1] + 1
    //                    }
    //                    else {
    //                        overlap_info[i][k][4] = [overlap_info[i][k][2]-overlap_info[i]['codon'][1]-1, overlap_info[i][k][2]-overlap_info[i]['codon'][1]-2];
    //                    }
    //                }
    //            
    //        }
    //    }



    optimize_info = func.optimize(overlap_info, data.Edit_window_start, data.Edit_window_end);

    sort_grna = func.sort_gRNA(optimize_info);


    //    如果gRNA database不为空则寻找offtarget
    if (data.database !== '') {
        offtarget_info = jsonfile.readFileSync(app.getAppPath() + "/offtarget_info/" + data.database);
        sort_grna = func.get_offtarget(sort_grna, offtarget_info, data.pam);
    }



    // 在全部信息中添加codon
    var codon_info = [];
    for (let i in sort_grna) {
        for (let k in sort_grna[i]) {
            var codon = sort_grna[i][k][6][0],
                codon_start = sort_grna[i][k][6][1],
                codon_end = sort_grna[i][k][6][2];

            if (!func.isInArray(codon_info, ['target codon', codon_start, codon_end, codon, '#389438'])) {
                // for (let i=codon_start; i<codon_end; i++){
                //     codon_info.push(['DNA', i, i+1, codon[i-codon_start], '#e43e3a'])
                // }
                codon_info.push(['target codon', codon_start, codon_end, codon, '#389438'])
            }
        }
    }

    // 将codon中信息按位置排序
    codon_info.sort(function (a, b) {
        return a[1] - b[1]
    });

    for (let i in codon_info) {
        output_info.push(codon_info[i]);
        codon_info[i][5] = "#" + String((Number(i) + 1));
        let codon = codon_info[i][3],
            codon_start = codon_info[i][1],
            codon_end = codon_info[i][2],
            codon_num = codon_info[i][5];
        for (let i = codon_start; i < codon_end; i++) {
            info.all_info.push(['DNA', i, i + 1, codon[i - codon_start], '#389438', codon, codon_num, codon_start + 1, codon_end])
        }
        // info.all_info.push(codon_info[i]);
        // info_r.all_info.push(codon_info[i])
    }



    // 在全部信息中添加gRNA
    for (let i in sort_grna) {

        info['category'].splice(0, 0, i);

        for (let k in sort_grna[i]) {

            var grna = sort_grna[i][k][0],
                grna_start = sort_grna[i][k][1],
                grna_end = sort_grna[i][k][2],
                grna_strand = sort_grna[i][k][3];
            var window = sort_grna[i][k][4],
                codon_info = sort_grna[i][k][6],
                offtarget_info = sort_grna[i][k][7];

            if (grna_strand === '+') {
                let grna_tmp = grna.slice(0, grna.length - data.pam.length);
                let pam_tmp = grna.slice(grna.length - data.pam.length);
                output_info.push(['sgRNA', grna_start, grna_end, grna_tmp, offtarget_info, grna_strand, window, codon_info, pam_tmp]);
            } else {
                let grna_tmp = func.reverse_complement(grna, true, false).slice(0, grna.length - data.pam.length);
                let pam_tmp = func.reverse_complement(grna, true, false).slice(grna.length - data.pam.length);
                output_info.push(['sgRNA', grna_start, grna_end, grna_tmp, offtarget_info, grna_strand, window, codon_info, pam_tmp]);
            }


            // 添加gRNA

            if (grna_strand === "+") {
                for (let y = grna_start; y < grna_end; y++) {
                    info.all_info.push([i, y, y + 1, grna.slice(0, grna.length - data.pam.length)[y - grna_start], '#3C64C9', grna_strand, window, codon_info, offtarget_info, [grna.slice(0, grna.length - data.pam.length), grna_start, grna_end]])
                }
                // info.all_info.push([i, grna_start, grna_end, grna.slice(0,grna.length-data.pam.length), '#6481c9', grna_strand, window, editor, codon_info]);
            } else {
                for (let y = grna_start; y < grna_end; y++) {
                    info.all_info.push([i, y, y + 1, grna.slice(data.pam.length)[y - grna_start], '#3C64C9', grna_strand, window, codon_info, offtarget_info, [func.reverse_complement(grna.slice(data.pam.length), true, false) , grna_start, grna_end]])
                }

                // info.all_info.push([i, grna_start, grna_end, grna.slice(data.pam.length), '#53c165', grna_strand, window, editor, codon_info]);
            }


            // 添加PAM
            if (grna_strand === "+") {
                for (let y = grna_end; y < grna_end + data.pam.length; y++) {
                    info.all_info.push([i, y, y + 1, grna.slice(grna.length - data.pam.length)[y - grna_end], '#E03431', grna_strand, window, codon_info, offtarget_info, [grna.slice(0, grna.length - data.pam.length), grna_start, grna_end]])
                }
                // info.all_info.push([i, grna_end, grna_end+data.pam.length, grna.slice(grna.length-data.pam.length), '#e4563a', grna_strand, window, editor, codon_info, offtarget_info, [grna.slice(0,grna.length-data.pam.length), grna_start, grna_end]]);

            } else {
                for (let y = grna_start - data.pam.length; y < grna_start; y++) {
                    info.all_info.push([i, y, y + 1, grna.slice(0, data.pam.length)[y - (grna_start - data.pam.length)], '#E03431', grna_strand, window, codon_info, offtarget_info, [func.reverse_complement(grna.slice(data.pam.length), true, false), grna_start, grna_end]])
                }
                // info.all_info.push([i, grna_start-data.pam.length, grna_start, grna.slice(0,data.pam.length), '#e4563a', grna_strand, window, editor, codon_info, offtarget_info, [grna.slice(data.pam.length), grna_start, grna_end]]);
            }
            // info_r.all_info.push([i, grna_start, grna_end, grna, '#00B2EE', grna_strand, window, editor, codon_info])
        }
    }


});



ipcMain.on('get_data', function (event, data) {

    for (let i in info['all_info']) {
        if (info['all_info'][i][0] === 'DNA' || 'protein' || 'CDS') {
            output_info.push(info['all_info'][i])
        }
    }

    event.sender.send('send_data', [info, output_info]);

    info = {
        'all_info': [],
        'category': ['protein', 'CDS', 'DNA'],
        'dna_len': 0
    };
    output_info = []
    // info_r = {'all_info':[], 'category':['CDS', 'DNA', 'protein'], 'dna_len':0};



    mainWindow.webContents.on('crashed', () => {
        const options = {
            type: 'info',
            title: '渲染进程崩溃',
            message: '这个进程已崩溃',
            buttons: ['重载', '关闭']
        };

        dialog.showMessageBox(options, (index) => {
            if (index === 0) {
                mainWindow.reload()
            } else {
                mainWindow.close()
            }
        })
    });
});
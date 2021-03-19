// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
var form_info = {'isform': 1, 'dna_sequence':'', 'cds_sequence':'', 'pam':'', 'grna_length':'', 'DS': false, 'DF':false, 'CS':false, 'CF':false, 'FA':false, 'database':''};
const snapgeneToJson = require('bio-parsers').snapgeneToJson;
const fs = require("fs");
const wget = require('wget-improved');
const func = require('./func');


$(document).ready(function(){


    ipcRenderer.send('get_app_path', '');

    ipcRenderer.on('send_app_path', function (event, data) {
        app_path = data

        fs.readdir(app_path + '/offtarget_info/', function (err, files) {
            if (err) {console.log('read file direction failed')}
            else {
                for (let i in files){
                    if (files[i].indexOf('json') != -1) {
                        $("#offtarget").append("<option value="+files[i]+">"+offtarget_file_table(files[i])+" </option>");
                    }
                }
    
    //            向index.html中添加需要下载的offtarget数据
    //            var no_download = func.list_subtract(all_database, files);
    //            for (let i in no_download){
    //                if (no_download[i] === 'os_cas9_ngg_20_offtarget_info.json'){
    //                    $("#download").append("\"<option value="+'os_cas9_ngg_20_offtarget_info.json'+"> Oryza_sativa cas9 NGG 20 </option>\"")
    //                }
    //
    //                else if (no_download[i] === 'os_cas12_tttv_23_offtarget_info.json'){
    //                    $("#download").append("\"<option value="+'os_cas12_tttv_23_offtarget_info.json'+"> Oryza_sativa cas12 TTTV 23 </option>\"")
    //                }
    //            }
            }
        });
        
    });


    $("#genbank_option").click(function () {
        if($("#snapgene_content").css("display")==='block') {
            $("#snapgene_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='block') {
            $("#fasta_content").slideToggle("slow");
        }
        if($("#genbank_content").css("display")==='none') {
            $("#genbank_content").slideToggle("slow");
        }

        $('#gb_file').prop("disabled", false);
        $('#isoform_num').prop("disabled", false);
        $('#sg_file').prop("disabled", true);
        $('#isoform_num2').prop("disabled", true);
        $('#dna_file').prop("disabled", true);
        $('#dna_sequence').prop("disabled", true);
        $('#cds_file').prop("disabled", true);
        $('#cds_sequence').prop("disabled", true);
        $('#sg_file').val('');
        $('#sg_file_label').html('Load SnapGene file');
        $('#isoform_num2').val('');
        $('#dna_sequence').val('');
        $('#cds_sequence').val('');
        $('#dna_file').val('');
        $('#dna_file_label').html('Load DNA Fasta file');
        $('#cds_file').val('');
        $('#cds_file_label').html('Load CDS Fasta file');
    });

    $("#snapgene_option").click(function () {
        if($("#genbank_content").css("display")==='block'){
            $("#genbank_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='block') {
            $("#fasta_content").slideToggle("slow");
        }
        if($("#snapgene_content").css("display")==='none') {
            $("#snapgene_content").slideToggle("slow");
        }

        $('#sg_file').prop("disabled", false);
        $('#isoform_num2').prop("disabled", false);
        $('#gb_file').prop("disabled", true);
        $('#isoform_num').prop("disabled", true);
        $('#dna_file').prop("disabled", true);
        $('#dna_sequence').prop("disabled", true);
        $('#cds_file').prop("disabled", true);
        $('#cds_sequence').prop("disabled", true);
        $('#gb_file').val('');
        $('#gb_file_label').html('Load GenBank file');
        $('#isoform_num').val('');
        $('#dna_sequence').val('');
        $('#cds_sequence').val('');
        $('#dna_file').val('');
        $('#dna_file_label').html('Load DNA Fasta file');
        $('#cds_file').val('');
        $('#cds_file_label').html('Load CDS Fasta file');
    });

    $("#fasta_option").click(function () {
        if($("#genbank_content").css("display")==='block'){
            $("#genbank_content").slideToggle("slow");
        }
        if($("#snapgene_content").css("display")==='block') {
            $("#snapgene_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='none') {
            $("#fasta_content").slideToggle("slow");
        }

        $('#dna_file').prop("disabled", false);
        $('#dna_sequence').prop("disabled", false);
        $('#cds_file').prop("disabled", false);
        $('#cds_sequence').prop("disabled", false);
        $('#gb_file').prop("disabled", true);
        $('#isoform_num').prop("disabled", true);
        $('#sg_file').prop("disabled", true);
        $('#isoform_num2').prop("disabled", true);
        $('#gb_file').val('');
        $('#gb_file_label').html('Load GenBank file');
        $('#isoform_num').val('');
        $('#sg_file').val('');
        $('#sg_file_label').html('Load SnapGene file');
        $('#isoform_num2').val('');
    });

    $("#download_btn").click(function () {
        $("#spinner").slideToggle("slow")
    });


    $("#myCanvas1").attr({"width": $(".title").width()-300,
        "height": 30
    });
    var c1=document.getElementById("myCanvas1");
    var ctx1=c1.getContext("2d");
    ctx1.moveTo(0,15);
    ctx1.lineTo($(".title").width()-300,15);
    ctx1.stroke();


    $("#myCanvas2").attr({"width": $(".title").width()-300,
        "height": 30
    });
    var c2=document.getElementById("myCanvas2");
    var ctx2=c2.getContext("2d");
    ctx2.moveTo(0,15);
    ctx2.lineTo($(".title").width()-300,15);
    ctx2.stroke();


    $(window).resize(function () {

        $("#myCanvas1").attr({"width": $(".title").width()-300,
            "height": 30
        });
        var c1=document.getElementById("myCanvas1");
        var ctx1=c1.getContext("2d");
        ctx1.moveTo(0,15);
        ctx1.lineTo($(".title").width()-300,15);
        ctx1.stroke();


        $("#myCanvas2").attr({"width": $(".title").width()-300,
            "height": 30
        });
        var c2=document.getElementById("myCanvas2");
        var ctx2=c2.getContext("2d");
        ctx2.moveTo(0,15);
        ctx2.lineTo($(".title").width()-300,15);
        ctx2.stroke();
    });

    $("#gb_file").bind("change",function () {
        $('#gb_file_label').text(this.files[0]['name'])
    });

    $("#sg_file").bind("change",function () {
        $('#sg_file_label').text(this.files[0]['name'])
    });

    $("#dna_file").bind("change",function () {
        $('#dna_file_label').text(this.files[0]['name'])
    });

    $("#cds_file").bind("change",function () {
        $('#cds_file_label').text(this.files[0]['name'])
    });

    // var value = 0;
    // setInterval(function(){
    //     if (value != 100) {
    //         value = parseInt(value) + 1;
    //         $("#prog").css("width", value + "%").text(value + "%");
    //         if (value>=0 && value<=30) {
    //             $("#prog").addClass("progress-bar-danger");
    //         } else if (value>=30 && value <=60) {
    //             $("#prog").removeClass("progress-bar-danger");
    //             $("#prog").addClass("progress-bar-warning");
    //         } else if (value>=60 && value <=90) {
    //             $("#prog").removeClass("progress-bar-warning");
    //             $("#prog").addClass("progress-bar-info");
    //         } else if(value >= 90 && value<100) {
    //             $("#prog").removeClass("progress-bar-info");
    //             $("#prog").addClass("progress-bar-success");
    //         }
    //     }
    // }, 50);

    $("#genbank_option").click(function () {

        $("#snapgene_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#FFFFFF");
        $("#genbank_option").css("color","#c3325f");

    });

    $("#snapgene_option").click(function () {

        $("#genbank_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#FFFFFF");
        $("#snapgene_option").css("color","#c3325f");

    });

    $("#fasta_option").click(function () {

        $("#genbank_option").css("color","#FFFFFF");
        $("#snapgene_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#c3325f");

    });



});


function analyse_isform() {
    var inputfile = document.getElementById('gb_file');

    var file = inputfile.files[0];

    var reader = new FileReader();

    reader.readAsText(file,'utf8');
    reader.onload = function () {
        ipcRenderer.send('sent_gb', this.result)
    };
}

function analyse_isform2(file) {
    let isoform_num = 0;
    const options = {
        fileName: "example.fa", //the filename is used if none is found in the genbank
        isProtein: false, //if you know that it is a protein string being parsed you can pass true here
        //genbankToJson options only
        inclusive1BasedStart: false, //by default feature starts are parsed out as 0-based and inclusive
        inclusive1BasedEnd: false, //by default feature ends are parsed out as 0-based and inclusive
        acceptParts: true //by default features with a feature.notes.pragma[0] === "Teselagen_Part" are added to the sequenceData.parts array. Setting this to false will keep them as features instead
    };

    snapgeneToJson(file, function(result) {
        $('#isoform_num2').empty();
        for (let i in result[0]['parsedSequence']['features']){
            if (result[0]['parsedSequence']['features'][i]['type'] === 'CDS'){
                isoform_num += 1;
                $("#isoform_num2").append("\"<option value="+isoform_num+">"+isoform_num+"</option>\"")
            }
        }

        ipcRenderer.send('sent_sg', result)
    },options);


}


function read_dna_fa() {
    var inputfile = document.getElementById('dna_file');

    var file = inputfile.files[0];

    var reader = new FileReader();

    reader.readAsText(file,'utf8');
    reader.onload = function () {
        ipcRenderer.send('sent_dna_fa', this.result)
    };
}


function read_cds_fa() {
    var inputfile = document.getElementById('cds_file');

    var file = inputfile.files[0];

    var reader = new FileReader();

    reader.readAsText(file,'utf8');
    reader.onload = function () {
        ipcRenderer.send('sent_cds_fa', this.result)
    };
}



ipcRenderer.on('append_isoform', function (event, data) {
    $('#isoform_num').empty();
    for (var i=1; i<=data; i++ ){
        $("#isoform_num").append("\"<option value="+i+">"+i+"</option>\"")
    }
});

function analyse() {
    if ($("#isoform_num").val()){
        form_info.isform = $("#isoform_num").val()
    }else {form_info.isform = $("#isoform_num2").val()}

    form_info.pam = $('#PAM').val().toUpperCase();
    form_info.grna_length = Number($('#gRNA_length').val());
    form_info.Edit_window_start = Number($('#Edit_window_start').val());
    form_info.Edit_window_end = Number($('#Edit_window_end').val());
    form_info.dna_sequence = $('#dna_sequence').val().toUpperCase();
    form_info.cds_sequence = $('#cds_sequence').val().toUpperCase();
    if ($("#fasta_content").css("display")==='block'){
        form_info.FA = true
    }
    if ($('#dna_sequence').val() !== ''){form_info.DS = true}
    if ($('#dna_file').val() !== ''){form_info.DF = true}
    if ($('#cds_sequence').val() !== ''){form_info.CS = true}
    if ($('#cds_file').val() !== ''){form_info.CF = true}
    form_info.database = $('#offtarget').val();

    ipcRenderer.send('analyse', form_info);
    ipcRenderer.on('no_hit', function (event, data) {
        alert('CDS NO Hit DNA,Please enter again')
    })
}

ipcRenderer.on('gb_err', function () {
    alert("Oops... Please input right format file.");
    //   $('#gb_file').val("")
});

//function change_editor() {
//    if ($('#pam').val() === 'TTTV'){$('#grna_length').val('23')}
//    if ($('#pam').val() === 'NGG'){$('#grna_length').val('20')}
//}

function change_Cas9_variants() {
    if ($('#Cas9_variants').val() === 'spCas9(NGG)'){$('#PAM').val('NGG')}
    if ($('#Cas9_variants').val() === 'spCas9-VQR(NGA)'){$('#PAM').val('NGA')}
    if ($('#Cas9_variants').val() === 'spCas9-NG(NG)'){$('#PAM').val('NG')}
    if ($('#Cas9_variants').val() === 'spCas9-NRRH(NRRH)'){$('#PAM').val('NRRH')}
    if ($('#Cas9_variants').val() === 'spCas9-NRCH(NRCH)'){$('#PAM').val('NRCH')}
    if ($('#Cas9_variants').val() === 'spCas9-NRTH(NRTH)'){$('#PAM').val('NRTH')}
    if ($('#Cas9_variants').val() === 'SpRYCas9(NRN)'){$('#PAM').val('NRN')}
    if ($('#Cas9_variants').val() === 'SpRYcas9(NYN)'){$('#PAM').val('NYN')}
    $('#gRNA_length').val('20')
}

function change_Deaminase() {
    if ($('#Deaminase').val() === 'Cas9D10A-PmCDA1-UGI'){$('#Edit_window_start').val('2'),$('#Edit_window_end').val('6')}
    if ($('#Deaminase').val() === 'PmCDA1-CBE_V02'){$('#Edit_window_start').val('2'),$('#Edit_window_end').val('6')}
    if ($('#Deaminase').val() === 'BE3-hAID'){$('#Edit_window_start').val('4'),$('#Edit_window_end').val('12')}
    if ($('#Deaminase').val() === 'BE3-rAPOBEC1'){$('#Edit_window_start').val('4'),$('#Edit_window_end').val('12')}
    if ($('#Deaminase').val() === 'BE3-A3A'){$('#Edit_window_start').val('4'),$('#Edit_window_end').val('12')}
    if ($('#Deaminase').val() === 'BE3-A3A/Y130F'){$('#Edit_window_start').val('4'),$('#Edit_window_end').val('12')}
    if ($('#Deaminase').val() === 'A3A/Y130F-CBE_V02'){$('#Edit_window_start').val('4'),$('#Edit_window_end').val('12')}
}


function download_offtarget_info(){
    if($("#download_refresh").css("display")==='none') {
        $("#download_refresh").slideToggle("slow");
    }

    let download = wget.download('https://sourceforge.net/projects/crispr-bets/files/' + $('#download').val(), './offtarget_info/'+$('#download').val());

    download.on('error', function(err) {
        console.log(err);
    });

    download.on('start', function(fileSize) {
        console.log(fileSize);
        if($("#download_finish").css("display")==='inline') {
            $("#download_finish").slideToggle("slow");
        }

        if($("#download_check").css("display")==='inline-block') {
            $("#download_check").slideToggle("slow");
        }

        $("#file_size").text('Download File Size:' + Math.ceil(fileSize/1000000) + 'Mb')
    });

    download.on('end', function(output) {
        console.log(output);
        if($("#download_refresh").css("display")==='inline-block') {
            $("#download_refresh").slideToggle("slow");
        }
        $("#download_finish").slideToggle("slow");
        $("#download_check").slideToggle("slow");

//       下载介绍后在offtarget栏添加信息
        fs.readdir('./offtarget_info/', function (err, files) {
            if (err) {console.log('read file direction failed')}
            else {
                if (files.indexOf($('#download').val() != -1)){
                    $("#offtarget").append("<option value="+$('#download').val()+">"+offtarget_file_table($('#download').val())+"</option>")
                }
            }
        });

    });

    download.on('progress', function(progress) {

        $("#download_progress").css("width", parseInt(progress*100) + "%").text(parseInt(progress*100) + "%");

    });

    if($("#download_info").css("display")==='none') {
        $("#download_info").slideToggle("slow");
    }

}



function offtarget_file_table(file_name){
    file_table = {
        "tigr7_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGG offtarget database',
        "tigr7_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGA offtarget database',
        "tigr7_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NAAR offtarget database',
        "tigr7_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGGNG offtarget database',
        "tigr7_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NNAGAAW offtarget database',
        "tigr7_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NNNNGATT offtarget database',
        "tigr7_20_YG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) YG offtarget database',

        "tair10_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGG offtarget database',
        "tair10_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGA offtarget database',
        "tair10_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NAAR offtarget database',
        "tair10_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGGNG offtarget database',
        "tair10_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNAGAAW offtarget database',
        "tair10_20_NNG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNG offtarget database',
        "tair10_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNNNGATT offtarget database',
        "tair10_20_NR_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NR offtarget database',
        "tair10_20_YG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) YG offtarget database',
        
        "RefGen_v4_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGG offtarget database',
        "RefGen_v4_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGA offtarget database',
        "RefGen_v4_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NAAR offtarget database',
        "RefGen_v4_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGGNG offtarget database',
        "RefGen_v4_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NNAGAAW offtarget database',
        "RefGen_v4_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NNNNGATT offtarget database',
    }

    return file_table[file_name]
}

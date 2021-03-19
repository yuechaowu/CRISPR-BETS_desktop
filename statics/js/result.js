process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
//const {remote} = require('electron');
const {dialog}  = require('electron').remote;
const fs = require("fs");
const func = require('./func');

var dom_gene = document.getElementById("container_gene");
var Chart_gene = echarts.init(dom_gene);
var info, output_info;


$(document).ready(function(){

    ipcRenderer.send('get_data');
    ipcRenderer.on('send_data', function (event, data) {
        info = data[0];
        output_info = data[1];
        if (info.category.length === 3){
            alert('Oops... NO suited gRNA found!')
        }
        showgene(info.all_info, info.dna_len, info.category)
    });

    var clickNumber = 0;
    $('#reverse').click(function () {
        if (clickNumber % 2 ===0){
            showgene(info_r.all_info, info_r.dna_len, info_r.category)
        }else {
            showgene(info.all_info, info.dna_len, info.category)
        }
        clickNumber ++;
    });


    $(window).resize(function () {
        $("#container_gene").attr({"width": $(window).width(),
            "height": $(window).height() - 200
        });
        // $("#container_gene")
    })

});


function renderItem(params, api) {

    var categoryIndex = api.value(0);


    var start = api.coord([api.value(1), categoryIndex]);
    var end = api.coord([api.value(2), categoryIndex]);
    var name_label = api.value(3);

    if (api.value(4) === '#959ca3'){
        var height = api.size([0, 1])[1] * 0.05;
    }
    else {
        var height = api.size([0, 1])[1] * 0.2;
    }




    var rectShape = echarts.graphic.clipRectByRect({
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height
    }, {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height
    });

    return rectShape && {
        type: 'rect',
        shape: rectShape,
        style: api.style()
    };
}


option = {


    legend:{
        left:30,
        right:30
    },

    toolbox: {
        itemSize:25,
        itemGap:15,
        right:30,
        feature: {
            saveAsImage: {
                title: 'save result as png',
                icon:'image://statics/img/photo.png',
                pixelRatio:2
            },
            myTool1: {
                show: true,
                title: 'save result as file',
                icon: 'image://statics/img/file.png',
                onclick: function (){

                filename = dialog.showSaveDialog({}
                    ).then(result => {
                      filename = result.filePath;
                      if (filename === undefined) {
                        alert('the user clicked the btn but didn\'t created a file');
                        return;
                      }
                      fs.writeFile(filename,  func.savefile(output_info), (err) => {
                        if (err) {
                          alert('an error ocurred with file creation ' + err.message);
                          return
                        }
                        alert('CREATED FILE SUCCESFULLY!');
                      })
                    }).catch(err => {
                      alert(err)
                    })

                }
            },
        }
    },

    tooltip: {

        axisPointer: {
            type: 'cross',
        },
        confine: true,

        formatter: function (params) {

            var start_num = Number(params.value[1])+1;
            if (params.name === "DNA" && params.value[4] === '#c5cfd8'){
                return params.marker + params.name + ': ' + params.value[3] + ' ' +params.value[2] ;
            }else if(params.name === "CDS"){
                return params.marker + params.value[3] + ": " + start_num + "-" + params.value[2];
            }else if(params.name === "DNA" && params.value[4] === '#389438'){
                return params.marker + "target codon" + params.value[6] + ": " + params.value[5] + " " + params.value[7] + "-" + params.value[8]
            } else if(params.name.indexOf("g") !== -1){

                offtarget_info = '';
                if (typeof (params.value[8]) === "string"){
                    offtarget_info = params.value[8] + '   (mismatch0-mismatch1-mismatch2-mismatch3)'
                }
                else if (params.value[8] == null){
                    offtarget_info = 'No gRNA offtarget information'
                }
//                else {
//                    for(let i=0; i<=5; i++){
//                        if (String(i) in params.value[8]){
//                            if (i===0){
//                                offtarget_info += 'mismatch'+ String(i) + ':' + String(Number(params.value[8][i][0])-1) + '(' + String(Number(params.value[8][i][1]-1)) + ')' + "<br/>"
//                            }
//                            else { offtarget_info += 'mismatch'+ String(i) + ':' + params.value[8][i][0]+'('+params.value[8][i][1]+')' + "<br/>"}
//
//                        }
//                    }
//                }

//                offtarget_example = 'mismatch1:5(2) means in genome-wide mismatch one base is allowed have 5 same site,' + "</br>" +'The Numbers in parentheses is 2 out of 5 overlap with gene CDS, The lower the number the better'

                var gRNA_seqeunce = "<a style='color: #31b0d5'><em> <strong>gRNA sequence: </strong></em></a>" + ' ' + params.value[9][0] + "<br/>";
                var gRNA_position = "<a style='color: #31b0d5'><em> <strong>gRNA position: </strong></em></a>" + ' ' +Number(params.value[9][1]+1) + "-" + params.value[9][2] + "   strand:" + params.value[5] + "<br/>";
                var target_info = "<a style='color: #31b0d5'><em> <strong>Target codon: </strong></em></a>" + ' ' + params.value[7][3] + " " + params.value[7][0] + " " + (Number(params.value[7][1]) + 1) + "-" + params.value[7][2] + "<br/>";
                var editing_position = "<a style='color: #31b0d5'><em> <strong>Editing position: </strong></em></a>" + ' ' + params.value[6] + "<br/>"
                offtarget_info = "<a style='color: #31b0d5'><em> <strong>Offtarget info:</strong></em></a> " + offtarget_info;
//                offtarget_example = "<a style='color: #31b0d5'><em> <strong>example:</strong></em></a> "+ offtarget_example;

                return gRNA_seqeunce + "<br/>" + gRNA_position + "<br/>" + target_info +  "<br/>" + editing_position + "<br/>"  + offtarget_info
            }
            else if(params.name === "protein"){
                return params.marker + params.name + ': ' + params.value[3] + '  ' +params.value[1] + '-' + params.value[2];
            }
        }
    },

    title: {
        text: 'Result Panel',
        left: 'center'
    },

    dataZoom: [{
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        height: 20,
        bottom: 0,
        handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        showDetail: false
    }, {
        type: 'inside',
        id: 'insideX',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        zoomOnMouseWheel: true,
        moveOnMouseMove: true
    }],

    // dataZoom: [{
    //     type: 'slider',
    //     filterMode: 'weakFilter',
    //     showDataShadow: false,
    //     top: 700,
    //     height: 10,
    //     ZoomLock:true,
    //     throttle:0,
    //     borderColor: 'transparent',
    //     backgroundColor: '#e2e2e2',
    //     handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z', // jshint ignore:line
    //     handleSize: 15,
    //     handleStyle: {
    //         shadowBlur: 6,
    //         shadowOffsetX: 1,
    //         shadowOffsetY: 2,
    //         shadowColor: '#aaa'
    //     },
    //     labelFormatter: '',
    // }, {
    //     type: 'inside',
    //     filterMode: 'weakFilter'
    // }],

    // grid: {
    //     left:'7%',
    //     height:600,
    //     width:'90%',
    // },

    xAxis: {
        min: 0,
        scale: true,
        axisLabel: {
            formatter: function (val) {
                return Math.max(0, val);
            }
        },
        splitLine: {
            show: false
        }
    },

    yAxis: {
        // data: categories,
        axisLabel: {
            fontWeight:'bold',
            fontSize:15,
            formatter: function (value, index) {
                if (value === "gRNA1"){
                    return value.slice(0,value.length-1)
                }
                else if (value.indexOf('gR') !== -1){
                    return ""
                }

                else {
                    return value
                }
            }
        },

    },

    series: [{
        type: 'custom',
        renderItem: renderItem,
        itemStyle: {
            normal: {
                opacity:0.8
            }
        },
        label: {
            normal: {
                show: false,
                position: 'bottom',
                color: '#24262e',
                // fontStyle:'oblique',
                fontSize: 18,
            }
        },
        encode: {
            x: [1, 2],
            y: 0,
            label: 3
        },
        data: 0,
    }]
};


function showgene(seq_list,gene_length,category){
    seq_list = echarts.util.map(seq_list, function (item, index) {
        return {
            value: item,
            itemStyle: {
                normal: {
                    color: item[4]
                }
            }
        };
    });

    Chart_gene.showLoading();
    if (option && typeof option === "object")
        option["yAxis"]["data"] = category;
    option["xAxis"]["max"] = gene_length;
    option["series"][0]["data"] = seq_list;
    Chart_gene.setOption(option, true);
    Chart_gene.hideLoading();
    return null;
}



//点击下方出现每个feature的信息

//Chart_gene.on('click', function (params) {
//    if (params.name.indexOf("g") !== -1){
//        var info = '';
//        for (i in params.value[7]){
//            if (i !== '0'){
//                info += '<br/><br/>'
//            }
//            info += (Number(i)+1) + '. ' + 'editor: ' + params.value[7][i]['editor'] + '<br/>' + 'ref:' + '<em>'+ params.value[7][i]['ref']+ '</em>' + '<br/>' + 'edit_window:' + params.value[7][i]['window'][0] + '-' + params.value[7][i]['window'][1]
//        }
//
//        if ($("#grna_info").css('display') === 'none'){
//            $("#editor").html(info);
//            $("#grna_info").slideDown('slow')
//        }else {
//            $("#grna_info").slideUp('slow');
//            $("#editor").html(info);
//            $("#grna_info").slideDown('slow')
//        }
//
//
//    }
//});


function datazoom_location() {

    var from_num = Number(document.getElementById("from").value);
    var end_num = Number(document.getElementById("end").value);

    if (option && typeof option ==="object"){
        option["dataZoom"][0]["start"] = (from_num / info.dna_len) *100;
        option["dataZoom"][0]["end"] = (end_num / info.dna_len) *100;
        Chart_gene.setOption(option, true);
    }

}

// 监听缩放事件
i = 0;
Chart_gene.on('dataZoom', function (para) {

    if ((para['batch'][0]['end'] - para['batch'][0]['start']) * info.dna_len / 100 < 120   && i===0){
            option["series"][0]["label"]['normal']['show'] = true;
            option["dataZoom"][0]["start"] = para['batch'][0]['start'];
            option["dataZoom"][0]["end"] = para['batch'][0]['end'];
            Chart_gene.setOption(option, true);
            i+=1
    }
    if ((para['batch'][0]['end'] - para['batch'][0]['start']) * info.dna_len / 100 > 150   && i===1){
        option["series"][0]["label"]['normal']['show'] = false;
        option["dataZoom"][0]["start"] = para['batch'][0]['start'];
        option["dataZoom"][0]["end"] = para['batch'][0]['end'];
        Chart_gene.setOption(option, true);
        i-=1
    }

});


// 图表结果随着页面大小自动调整
setTimeout(function (){
    window.onresize = function () {
        Chart_gene.resize();
    }
},200)






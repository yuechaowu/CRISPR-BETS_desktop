// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';


function translate(DNA_string) {
    protein_table = {
        'TTT': 'F',
        'CTT': 'L',
        'ATT': 'I',
        'GTT': 'V',
        'TTC': 'F',
        'CTC': 'L',
        'ATC': 'I',
        'GTC': 'V',
        'TTA': 'L',
        'CTA': 'L',
        'ATA': 'I',
        'GTA': 'V',
        'TTG': 'L',
        'CTG': 'L',
        'ATG': 'M',
        'GTG': 'V',
        'TCT': 'S',
        'CCT': 'P',
        'ACT': 'T',
        'GCT': 'A',
        'TCC': 'S',
        'CCC': 'P',
        'ACC': 'T',
        'GCC': 'A',
        'TCA': 'S',
        'CCA': 'P',
        'ACA': 'T',
        'GCA': 'A',
        'TCG': 'S',
        'CCG': 'P',
        'ACG': 'T',
        'GCG': 'A',
        'TAT': 'Y',
        'CAT': 'H',
        'AAT': 'N',
        'GAT': 'D',
        'TAC': 'Y',
        'CAC': 'H',
        'AAC': 'N',
        'GAC': 'D',
        'TAA': '*',
        'CAA': 'Q',
        'AAA': 'K',
        'GAA': 'E',
        'TAG': '*',
        'CAG': 'Q',
        'AAG': 'K',
        'GAG': 'E',
        'TGT': 'C',
        'CGT': 'R',
        'AGT': 'S',
        'GGT': 'G',
        'TGC': 'C',
        'CGC': 'R',
        'AGC': 'S',
        'GGC': 'G',
        'TGA': '*',
        'CGA': 'R',
        'AGA': 'R',
        'GGA': 'G',
        'TGG': 'W',
        'CGG': 'R',
        'AGG': 'R',
        'GGG': 'G',
    };

    var protein = {
        'protein1': '',
        'protein2': '',
        'protein3': ''
    };

    for (let i = 0; i < DNA_string.length - 2; i += 3) {
        codon = DNA_string[i] + DNA_string[i + 1] + DNA_string[i + 2];
        protein.protein1 += protein_table[codon]
    }

    for (let i = 1; i < DNA_string.length - 2; i += 3) {
        codon = DNA_string[i] + DNA_string[i + 1] + DNA_string[i + 2];
        protein.protein2 += protein_table[codon]
    }

    for (let i = 2; i < DNA_string.length - 2; i += 3) {
        codon = DNA_string[i] + DNA_string[i + 1] + DNA_string[i + 2];
        protein.protein3 += protein_table[codon]
    }

    return protein
}


function reverse_complement(seq, reverse = true, complement = true) {
    var complement_info = {
        'A': 'T',
        'T': 'A',
        'C': 'G',
        'G': 'C',
        'R': 'Y',
        'Y': 'R',
        'S': 'W',
        'W': 'S',
        'K': 'M',
        'M': 'K',
        'B': 'V',
        'D': 'H',
        'H': 'D',
        'V': 'B'
    };

    if (reverse && !complement) {
        return seq.split('').reverse().join('')
    } else if (!reverse && complement) {
        let com_seq = '';
        for (let i = 0; i < seq.length; i++) {
            com_seq += complement_info[seq[i]]
        }
        return com_seq
    } else {
        let com_seq = '';
        for (let i = 0; i < seq.length; i++) {
            com_seq += complement_info[seq[i]]
        }
        return com_seq.split('').reverse().join('')
    }
}

function find_codon(cds, cds_info, isform_num) {
    var codon_info = [];

    // 将位于阅读框内的CAA CAG CGA TGG找出来
    for (let i = 0; i < cds.length; i += 3) {
        var codon = cds.slice(i, i + 3);
        if (codon === 'CAA' || codon === 'CAG' || codon === 'CGA' || codon === 'TGG') {
            codon_info.push([codon, i])
        }
    }

    // 将codon位置信息map到dna位置上
    for (let i in codon_info) {
        for (let k = 0; k < cds_info[isform_num]['locations'].length; k++) {
            if (codon_info[i][1] < cds_info[isform_num]['locations'][k]['marker']) {
                if (k === 0) {
                    codon_info[i][1] = codon_info[i][1] + cds_info[isform_num]['locations'][k]['start']
                } else {
                    codon_info[i][1] = codon_info[i][1] + cds_info[isform_num]['locations'][k]['start'] -
                        cds_info[isform_num]['locations'][k - 1]['marker'];
                }
                codon_info[i][2] = codon_info[i][1] + 3;
                break
            }
        }
    }

    // 将跨intron的codon删去
    codon_info = codon_info.filter(function (x) {
        for (let i in cds_info[isform_num]['locations']) {
            if (x[1] >= cds_info[isform_num]['locations'][i]['start'] && x[2] <= cds_info[isform_num]['locations'][i]['end'] + 1) {
                return true;
            }
        }
    });

    return codon_info
}


function find_grna(dna_string, pam, len_grna, reverse = false) {
    var grna_info = [];
    var pam_rev = reverse_complement(pam, true, false);
    var pam_re = '';
    var pam_re_rev = '';

    for (let i in pam) {
        if (pam[i] === 'N') {
            pam_re += '[ATCG]'
        } else if (pam[i] === 'R') {
            pam_re += '[AG]'
        } else if (pam[i] === 'W') {
            pam_re += '[AT]'
        } else if (pam[i] === 'M') {
            pam_re += '[AC]'
        } else if (pam[i] === 'Y') {
            pam_re += '[CT]'
        } else if (pam[i] === 'S') {
            pam_re += '[GC]'
        } else if (pam[i] === 'K') {
            pam_re += '[GT]'
        } else if (pam[i] === 'B') {
            pam_re += '[CGT]'
        } else if (pam[i] === 'D') {
            pam_re += '[AGT]'
        } else if (pam[i] === 'H') {
            pam_re += '[ACT]'
        } else if (pam[i] === 'V') {
            pam_re += '[ACG]'
        } else {
            pam_re += pam[i]
        }
    }
    for (let i in pam_rev) {
        if (pam_rev[i] === 'N') {
            pam_re_rev += '[ATCG]'
        } else if (pam_rev[i] === 'R') {
            pam_re_rev += '[AG]'
        } else if (pam_rev[i] === 'W') {
            pam_re_rev += '[AT]'
        } else if (pam_rev[i] === 'M') {
            pam_re_rev += '[AC]'
        } else if (pam_rev[i] === 'Y') {
            pam_re_rev += '[CT]'
        } else if (pam_rev[i] === 'S') {
            pam_re_rev += '[GC]'
        } else if (pam_rev[i] === 'K') {
            pam_re_rev += '[GT]'
        } else if (pam_rev[i] === 'B') {
            pam_re_rev += '[CGT]'
        } else if (pam_rev[i] === 'D') {
            pam_re_rev += '[AGT]'
        } else if (pam_rev[i] === 'H') {
            pam_re_rev += '[ACT]'
        } else if (pam_rev[i] === 'V') {
            pam_re_rev += '[ACG]'
        } else {
            pam_re_rev += pam_rev[i]
        }
    }


    var first_grna = new RegExp("[\\D]{" + len_grna + "}" + pam_re, 'gi');
    var first_grna_r = new RegExp(pam_re_rev + "[\\D]{" + len_grna + "}", 'gi');
    var first_pam = new RegExp(pam_re + "[\\D]{" + len_grna + "}", 'gi');
    var first_pam_r = new RegExp("[\\D]{" + len_grna + "}" + pam_re_rev, 'gi');

    if (reverse) {
        while (matches = first_pam.exec(dna_string)) {
            grna_info.push([matches[0], matches.index + pam.length, matches.index + pam.length + len_grna, '+']);
            first_pam.lastIndex -= (matches[0].length - 1);
        }
        while (matches = first_pam_r.exec(reverse_complement(dna_string, false, true))) {
            grna_info.push([matches[0], matches.index, matches.index + len_grna, '-']);
            first_pam_r.lastIndex -= (matches[0].length - 1);
        }

    } else {
        while (matches = first_grna.exec(dna_string)) {
            grna_info.push([matches[0], matches.index, matches.index + len_grna, '+']);
            first_grna.lastIndex -= (matches[0].length - 1);
        }
        while (matches = first_grna_r.exec(reverse_complement(dna_string, false, true))) {
            grna_info.push([matches[0], matches.index + pam.length, matches.index + pam.length + len_grna, '-']);
            first_grna_r.lastIndex -= (matches[0].length - 1);
        }
    }
    return grna_info
}


// function overlap(codon_info, grna_info, reverse = false) {
//     var overlap_info = [];
//     var tem

//     //    var flag = 1
//     // 5' grna + pam 3'情况
//     for (let i in codon_info) {
//         var num = 1;
//         //        flag++
//         var base = codon_info[i][1];
//         //        var codon_num = "codon"+flag
//         overlap_info.push({
//             'codon': codon_info[i]
//         });

//         if (codon_info[i][0] !== "TGG") {
//             for (let k in grna_info) {
//                 if (!reverse) {
//                     if (grna_info[k][3] === "+" && base >= grna_info[k][1] && base <= grna_info[k][2]) {
//                         //                        grna_info[k][4] = base - grna_info[k][1] + 1;
//                         overlap_info[i]["grna" + num] = grna_info[k];
//                         num++;
//                     }
//                 } else {
//                     if (grna_info[k][3] === "+" && base + 1 >= grna_info[k][1] && base <= grna_info[k][2]) {
//                         //                        grna_info[k][4] = grna_info[k][2] - base;
//                         if (grna_info[k][4] === 0) {
//                             continue
//                         }
//                         overlap_info[i]["grna" + num] = grna_info[k];
//                         num++;
//                     }
//                 }
//             }
//         } else {
//             for (let k in grna_info) {
//                 if (!reverse) {
//                     if (grna_info[k][3] === "-" && base + 3 >= grna_info[k][1] + 1 && base + 2 <= grna_info[k][2]) {
//                         //                        grna_info[k][4] = [grna_info[k][2]-base-1,grna_info[k][2]-base-2];
//                         overlap_info[i]["grna" + num] = grna_info[k];
//                         num++
//                     }
//                 } else {
//                     if (grna_info[k][3] === "-" && base + 3 >= grna_info[k][1] && base + 2 <= grna_info[k][2]) {
//                         //                        grna_info[k][4] = [grna_info[k][2]-base-1,grna_info[k][2]-base-2];
//                         overlap_info[i]["grna" + num] = grna_info[k];
//                         num++
//                     }
//                 }
//             }
//         }
//     }


//     overlap_info = overlap_info.filter(function (item) {
//         return Object.keys(item).length !== 1
//     });


//     return overlap_info
// }




function overlap(codon_info, grna_info, reverse = false) {
    overlap_info = []

    for (let i in codon_info) {
        overlap_info.push({
            'codon': codon_info[i]
        })
    }

    for (let i in overlap_info) {
        num = 1
        condon_seq = overlap_info[i]['codon'][0]
        condon_start = overlap_info[i]['codon'][1]
        condon_end = overlap_info[i]['codon'][2]


        for (let k in grna_info) {
            grna_strand = grna_info[k][3]
            grna_start = grna_info[k][1]
            grna_end = grna_info[k][2]
            if (!reverse) {

                if (grna_strand == "+" && condon_seq != 'TGG' && condon_start >= grna_start && condon_start <= grna_end) {
                    overlap_info[i]['grna' + num] = []
                    overlap_info[i]['grna' + num].push(grna_info[k][0])
                    overlap_info[i]['grna' + num].push(grna_info[k][1])
                    overlap_info[i]['grna' + num].push(grna_info[k][2])
                    overlap_info[i]['grna' + num].push(grna_info[k][3])
                    num++
                }
                if (grna_strand == "-" && condon_seq == 'TGG' && condon_start + 3 >= grna_start + 1 && condon_start + 2 <= grna_end) {
                    overlap_info[i]['grna' + num] = []
                    overlap_info[i]['grna' + num].push(grna_info[k][0])
                    overlap_info[i]['grna' + num].push(grna_info[k][1])
                    overlap_info[i]['grna' + num].push(grna_info[k][2])
                    overlap_info[i]['grna' + num].push(grna_info[k][3])
                    num++
                }
            }
        }

    }


    for (i in overlap_info) {

        for (feature in overlap_info[i]) {

            if (feature != "codon") {
                const starnd = overlap_info[i][feature][3]
                if (starnd == "+") {
                    const codon_base = overlap_info[i]['codon'][1]
                    // overlap_info[i][feature][4] = codon_base - overlap_info[i][feature][1] + 1
                    overlap_info[i][feature].push(codon_base - overlap_info[i][feature][1] + 1)
                } else {
                    const codon_base = overlap_info[i]['codon'][2]
                    overlap_info[i][feature][4] = [overlap_info[i][feature][2] - codon_base + 1, overlap_info[i][feature][2] - codon_base + 2]
                }
            }
        }
    }

    return overlap_info
}




function optimize(overlap_info, Edit_window_start, Edit_window_end) {


    // overlap_info[5]['grna1'][5] = []
    // console.log(overlap_info[5]['grna1'][5])
    // console.log(overlap_info[6]['grna1'][5])
    // console.log(overlap_info[6])


    // 根据grna位置筛选合适的编辑器
    for (let i = 0; i < overlap_info.length; i++) {


        for (let k in overlap_info[i]) {

            if (typeof (overlap_info[i][k][4]) === "number") {

                if (overlap_info[i][k][4] >= Edit_window_start && overlap_info[i][k][4] <= Edit_window_end) {
                    overlap_info[i][k][5] = 'keep'
                }
            } else if (typeof (overlap_info[i][k][4]) === "object") {
                if ((overlap_info[i][k][4][0] >= Edit_window_start && overlap_info[i][k][4][0] <= Edit_window_end) ||
                    (overlap_info[i][k][4][1] >= Edit_window_start && overlap_info[i][k][4][1] <= Edit_window_end)) {
                    overlap_info[i][k][5] = 'keep'
                }
            }


            //            for (let y in editor_info){
            //
            //                if (typeof (overlap_info[i][k][4]) === "number"){
            //
            //                    if (overlap_info[i][k][4] >= editor_info[y]["window"][0] && overlap_info[i][k][4] <= editor_info[y]["window"][1]){
            //                        if (!overlap_info[i][k][5]){
            //                            overlap_info[i][k][5] = [];
            //                            overlap_info[i][k][5].push(editor_info[y])
            //                        }else {overlap_info[i][k][5].push(editor_info[y])}
            //
            //                    }
            //                }
            //                else if(typeof (overlap_info[i][k][4]) === "object"){
            //                    if ( (overlap_info[i][k][4][0] >= editor_info[y]["window"][0] && overlap_info[i][k][4][0] <= editor_info[y]["window"][1]) ||
            //                        (overlap_info[i][k][4][1] >= editor_info[y]["window"][0] && overlap_info[i][k][4][1] <= editor_info[y]["window"][1])){
            //                        if (!overlap_info[i][k][5]){
            //                            overlap_info[i][k][5] = [];
            //                            overlap_info[i][k][5].push(editor_info[y])
            //                        }else {overlap_info[i][k][5].push(editor_info[y])}
            //                    }
            //                }
            //            }
        }
    }

    // 将没有editor的grna或codon删去
    for (let i in overlap_info) {
        for (let k in overlap_info[i]) {
            if (k !== "codon") {
                if (!overlap_info[i][k][5]) {
                    delete overlap_info[i][k]
                }
            }
        }
    }

    // 此方法删除数组元素时不会有index问题
    overlap_info = overlap_info.filter(function (item) {
        return Object.keys(item).length !== 1
    });

    // 给每个codon加上顺序数字
    for (let i in overlap_info) {
        overlap_info[i]['codon'][3] = "#" + (Number(i) + 1)
    }

    return overlap_info
}


function sort_gRNA(optimize_info) {
    var all_grna = [],
        sort_grna = {
            'gRNA1': [],
            'gRNA2': [],
            'gRNA3': [],
            'gRNA4': [],
            'gRNA5': [],
            'gRNA6': [],
            'gRNA7': [],
            'gRNA8': [],
            'gRNA9': [],
            'gRNA10': [],
            'gRNA11': [],
            'gRNA12': [],
            'gRNA13': [],
            'gRNA14': [],
            'gRNA15': []
        };

    for (let i in optimize_info) {
        for (let k in optimize_info[i]) {
            if (k !== "codon") {
                optimize_info[i][k].push(optimize_info[i]['codon']);
                all_grna.push(optimize_info[i][k])
            }
        }
    }

    for (let i = 1; i < all_grna.length; i++) {
        if (all_grna[i][1] - 6 <= all_grna[i - 1][2]) {
            sort_grna.gRNA2.push(all_grna[i]);
            all_grna.splice(i, 1);
            i--
        }
    }

    for (let i in all_grna) {
        sort_grna.gRNA1.push(all_grna[i])
    }


    for (let k = 2; k < Object.keys(sort_grna).length; k++) {
        for (let i = 1; i < sort_grna["gRNA" + k].length; i++) {
            if (sort_grna["gRNA" + k][i][1] - 6 <= sort_grna["gRNA" + k][i - 1][2]) {
                sort_grna["gRNA" + (k + 1)].push(sort_grna["gRNA" + k][i]);
                sort_grna["gRNA" + k].splice(i, 1);
                i--
            }
        }
    }

    for (let i in sort_grna) {
        if (sort_grna[i].length === 0) {
            delete sort_grna[i]
        }
    }

    return sort_grna
}


// 获得offtarget信息
function get_offtarget(sort_grna, offtarget_info, pam) {

    for (let i in sort_grna) {
        for (let k in sort_grna[i]) {
            if (sort_grna[i][k][3] === '+') {

                var grna_sequence = sort_grna[i][k][0].slice(0, 20);

                if (grna_sequence in offtarget_info) {
                    sort_grna[i][k].push(offtarget_info[grna_sequence])
                } else {
                    sort_grna[i][k].push('This gRNA offtarget infomation not found, please check offtarget database!')
                }
            } else {

                var grna_sequence = reverse_complement(sort_grna[i][k][0].slice(3, ), true, false);

                if (grna_sequence in offtarget_info) {
                    sort_grna[i][k].push(offtarget_info[grna_sequence])
                } else {
                    sort_grna[i][k].push('This gRNA offtarget infomation not found, please check offtarget database!')
                }
            }
        }
    }
    return sort_grna
}



function trim(s) {
    return s.replace(/(^\s*)|(\s*$)|[\r\n]|[#]/g, "");
}


// 判断某个数是否在数组中
function isInArray(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (value.toString() == arr[i].toString()) {
            return true;
        }
    }
    return false;
}


function savefile(all_info) {
    var DNA = "",
        cDNA = "",
        Codon = "",
        protein = "",
        gRNA = "";
    for (var i in all_info) {

        if (all_info[i][0] === "DNA") {
            DNA += all_info[i][3]
        }
        if (all_info[i][0] === "CDS") {
            cDNA += all_info[i][3] + ':' + all_info[i][1] + "-" + all_info[i][2] + "\t"
        }
        if (all_info[i][0] === "target codon") {
            Codon += all_info[i][1] + "-" + all_info[i][2] + "; " + all_info[i][3] + "; " + all_info[i][5] + "\t"
        }
        if (all_info[i][0] === "protein") {
            protein += all_info[i][3]
        }
        if (all_info[i][0] === 'sgRNA') {

            var offtarget_info = '';

            if (typeof (all_info[i][4]) === 'string') {
                offtarget_info = all_info[i][4]
            } else {
                offtarget_info = "No gRNA offtarget information"
            }


            try {
                gRNA += "Position:" + all_info[i][1] + "-" + all_info[i][2] + "; " + "Sequence:" + all_info[i][3] + "; " + "PAM:" + all_info[i][8] + "; " +
                    all_info[i][5] + "; " + "target_codon:" + all_info[i][7][3] + "; " + "window:" + all_info[i][6] + "; " + "offtarget_info:" + offtarget_info + "\t"
            } catch (e) {
                continue
            }
            // gRNA += all_info[i][1] + "-" + all_info[i][2] + " " + all_info[i][3] + " " + all_info[i][5] + " " + "target_codon:" + all_info[i][8] + "\n"
        }
    }

    return 'DNA' + '\t' + DNA + "\n" + "cDNA" + "\t" + cDNA + "\n" + "target codon" + "\t" + Codon + "\n" + "protein" + "\t" + protein + "\n" + "gRNA" + "\t" + gRNA
}


function list_subtract(a, b) {
    for (var i = 0; i < b.length; i++) {
        for (var j = 0; j < a.length; j++) {
            if (a[j] == b[i]) { //如果是id相同的，那么a[ j ].id == b[ i ].id
                a.splice(j, 1);
                j = j - 1;
            }
        }
    }
    return a;
}


function in_array(stringToQuery, arrayToSearch) {
    for (let i in arrayToSearch) {
        if (stringToQuery === arrayToSearch[i]) {
            return true
        }
    }
    return false
}



function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}



module.exports.translate = translate;
module.exports.reverse_complement = reverse_complement;
module.exports.find_codon = find_codon;
module.exports.find_grna = find_grna;
module.exports.overlap = overlap;
module.exports.optimize = optimize;
module.exports.sort_gRNA = sort_gRNA;
module.exports.trim = trim;
module.exports.savefile = savefile;
module.exports.get_offtarget = get_offtarget;
module.exports.isInArray = isInArray;
module.exports.list_subtract = list_subtract;
module.exports.in_array = in_array;
module.exports.sleep = sleep;
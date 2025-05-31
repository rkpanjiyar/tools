var CsvToHtmlTable = CsvToHtmlTable || {};
var hiddenColumns = ["Country", "$$","RSI","ATR","SMA 200","P/S","Optn Vol","HIV","IV","IvRank","OI","Scr","Rank","Rank+","Er #","Correlated"];
var hideRecent = false;
var hideFuture = false;
var noOfDayForTooClose = 5;
var noOfDayForTooFar = 30;

CsvToHtmlTable = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-container";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table \
            style='border-collapse: collapse;width: 100%;table-layout: auto;' \
            class='table-container table table-striped table-condensed' \
            id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);
        var $toggleColumn = $(".toggle-links");
        $toggleColumn.empty();

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead \
                    style='left: 0;top: 0;z-index: 10;background-color: cornflowerblue;'\
                    ></thead>");
                var csvHeaderRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $toggleColumnP = $("<p></p>")
                    .append($("<a class=\"toggle-vis-all\" "
                        + "data-column=\"" + csvHeaderRow.length
                        + "\">All</a>")).append(" - ");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                    $toggleColumnP.append(
                        $("<a class=\"toggle-vis\" data-column=\""
                        + headerIdx + "\">" + csvHeaderRow[headerIdx]
                        + "</a>")).append(" - ");
                }
                $tableHeadRow.append($("<th></th>").text("[P]"));
                $tableHeadRow.append($("<th></th>").text("[p200]"));
                $tableHead.append($tableHeadRow);
                $toggleColumnP.append(
                    $("<a class=\"toggle-vis\" "
                        + "data-column=\"" + (csvHeaderRow.length)
                        + "\">[p]</a>")).append(" - ");
                $toggleColumnP.append(
                    $("<a class=\"toggle-vis\" "
                        + "data-column=\"" + (csvHeaderRow.length+1)
                        + "\">[p200]</a>"));
                $toggleColumn.append($toggleColumnP);

                $table.append($tableHead);
                var $tableBody = $("<tbody class='highlightable'></tbody>");

                for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                    var rStyle = rowStyle(csvData[rowIdx]);
                    if (!hideRecent || !rStyle.style.includes("font-red")) {
                        if (!hideFuture || !rStyle.style.includes("font-grey")) {
                            var $tableBodyRow = $("<tr class='" + rStyle.style + "'></tr>");
                            for (var colIdx = 0; colIdx < csvData[rowIdx].length; colIdx++) {
                                var $tableBodyRowTd = $("<td" + (csvHeaderRow[colIdx] == 'Correlated' ? " style='white-space: pre-wrap;'" : "") + "></td>");
                                var cellTemplateFunc = customTemplates[colIdx];
                                if (cellTemplateFunc) {
                                    $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx], csvData[rowIdx][0]));
                                } else {
                                    $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                                }
                                $tableBodyRow.append($tableBodyRowTd);
                            }
                            $tableBodyRow.append($("<td></td>").text(rStyle.rank));
                            $tableBodyRow.append($("<td></td>").text(rStyle.rank200));
                            $tableBody.append($tableBodyRow);
                        }
                    }
                }
                $table.append($tableBody);

                const table = $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p>\
                        <a class='btn btn-info' href='" + csv_path + "'>\
                        <i class='glyphicon glyphicon-download'></i>\
                        Download as CSV</a></p>");
                }

                document.querySelectorAll('a.toggle-vis-all').forEach((el) => {
                    el.addEventListener('click', function (e) {
                        e.preventDefault();
                        let noCols = e.target.getAttribute('data-column');
                        let vis = table.columns(1).visible()[0]
                        e.target.style.backgroundColor = vis ? "#B91C1C" : "#007BFF"
                        buttons = document.querySelectorAll('a.toggle-vis');
                        for (let i = 1; i <= noCols; i++) {
                            table.columns(i).visible(!vis);
                            buttons[i].style.backgroundColor = vis ? "#B91C1C" : "#007BFF";
                        }
                    });
                });

                document.querySelectorAll('a.toggle-vis').forEach((el) => {
                    el.addEventListener('click', function (e) {
                        e.preventDefault();
                        let columnIdx = e.target.getAttribute('data-column');
                        let column = table.columns(columnIdx);
                        // Toggle the visibility
                        e.target.style.backgroundColor = column.visible()[0] ? "#B91C1C" : "#007BFF";
                        column.visible(!column.visible()[0]);
                    });
                });

                document.querySelectorAll('a.toggle-vis').forEach((el) => {
                    if (hiddenColumns.includes(el.text)) {
                        el.click();
                    }
                });
            });
    }
};

function getCsvPath(relative = true) {
    now = new Date();
    localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
    csv_path = "data/output-" + localDate.toISOString().substring(0,10) + ".csv";
    return relative ?  csv_path : "https://rkpanjiyar.github.io/tools/" + csv_path;
}

function format_finviz(text, symb) {
    return format_link(`https://finviz.com/quote.ashx?t=${symb}`, text);
}

function format_robinhood(text, symb) {
    return format_link(`https://robinhood.com/stocks/${symb}`, text);
}

function format_unusualwhales(text, symb) {
    return format_link(`https://unusualwhales.com/stock/${symb}/earnings`, text);
}

function format_barcharts(text, symb) {
    return format_link(`https://www.barchart.com/stocks/quotes/${symb}/overview`, text);
}

function format_tipranks(text, symb) {
    return format_link(`https://www.tipranks.com/stocks/${symb}`, text);
}

function format_marketchameleon(text, symb) {
    return format_link(`https://marketchameleon.com/Overview/${symb}/`, text);
}

function format_link(url, link) {
    if (link)
        return "<a class='att' href='" + url
            + "' target='_blank'>" + link
            + "<span class='bttt'>🌎:" + url.substring(8, url.indexOf('.com') + 4)
            + "<span></a>";
    else
        return "";
}

function format_all_links(text, symb) {
    var l1 = `https://finviz.com/quote.ashx?t=${symb}`;
    var l2 = `https://robinhood.com/stocks/${symb}`;
    var l3 = `https://unusualwhales.com/stock/${symb}/earnings`;
    var l4 = `https://www.barchart.com/stocks/quotes/${symb}/overview`;
    var l5 = `https://www.tipranks.com/stocks/${symb}/forecast`;
    var l6 = `https://marketchameleon.com/Overview/${symb}/`;
    return `<div class="dropdown">
              <span class="dropbtn">${symb} &#9662;</span>
              <div class="dropdown-content">
                <a href="${l1}">finviz</a>
                <a href="${l2}">robinhood</a>
                <a href="${l3}">unusualwhales</a>
                <a href="${l4}">barchart</a>
                <a href="${l5}">tipranks</a>
                <a href="${l6}">marketchameleon</a>
              </div>
            </div>`;
}

function tooClose() {
    const date = new Date();
    date.setDate(date.getDate() + noOfDayForTooClose /* no zone, earning too close*/);
    return date.toISOString().substring(0, 10);
}

function tooFar() {
    const date = new Date();
    date.setDate(date.getDate() + noOfDayForTooFar /* no zone, earning too far*/);
    return date.toISOString().substring(0, 10);
}

function rowStyle(row) {
    rs = {}
    const country = row[1], price = row[2], erDate = row[3],
        atr = row[5], sma200 = row[6], histMove = row[8],
        exptMove = row[9];
    if (country == "" && price == "") {
        rs.rank = "100.00%";
        rs.rank200 = "100.00%";
    } else {
        if (exptMove == "" || parseInt(exptMove) == 0 || parseFloat(histMove) == 0) {
            rs.rank = "-1000.00%";
        } else {
            rs.rank = ((((parseFloat(histMove) - parseFloat(exptMove)) / parseFloat(histMove)) * 100).toFixed(2)) + "%";
        }
        rs.rank200 = ((parseFloat(sma200.replace("%", "").replace("-","")) * parseFloat(price)) / (parseFloat(atr) * 100)).toFixed(2);
    }
    suf = parseInt((parseFloat(rs.rank) / 10));
    rs.style = exptMove == "" || parseInt(exptMove) == 0 || parseFloat(exptMove) > parseFloat(histMove)
        ? ""
        : "highlight-green-" + suf;
    if (erDate == "") {
        rs.style += " font-black";
    } else if (erDate < tooClose()) {
        rs.style += " font-red";
    } else if (erDate > tooFar()) {
        rs.style += " font-grey";
    }
    const iv = row[12];
    const histIV = row[11];
    // highlight if current IV is lower than historic IV
    if(getFirstDecimalNumber(iv) <= getFirstDecimalNumber(histIV)) {
		rs.style += " row-underline";
    }
    return rs;
}

function switchTheme() {
    const link = document.getElementById("themeLink");
    if (link.href.includes("light")) {
        link.href = "css/dark.css";
    } else {
        link.href = "css/light.css";
    }
}

function toggleRecent() {
    hideRecent = !hideRecent;
    const toggleBtn = document.getElementById("recent-toggle");
    toggleBtn.textContent = hideRecent ? "⌚" : "⏳";
    loadCsv();
}

function toggleFuture() {
    hideFuture = !hideFuture;
    const toggleBtn = document.getElementById("future-toggle");
    toggleBtn.textContent = hideFuture ? "⦾" : "🌈";
    loadCsv();
}

function getFirstDecimalNumber(str) {
  const match = str.match(/^-?\d+(\.\d+)?/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

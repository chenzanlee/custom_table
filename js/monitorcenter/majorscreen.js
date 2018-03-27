if (!Array.prototype.includes) {
	Object.defineProperty(Array.prototype, 'includes', {
		value : function(searchElement, fromIndex) {

			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			// 1. Let O be ? ToObject(this value).
			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If len is 0, return false.
			if (len === 0) {
				return false;
			}

			// 4. Let n be ? ToInteger(fromIndex).
			// (If fromIndex is undefined, this step produces the value 0.)
			var n = fromIndex | 0;

			// 5. If n ≥ 0, then
			// a. Let k be n.
			// 6. Else n < 0,
			// a. Let k be len + n.
			// b. If k < 0, let k be 0.
			var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

			function sameValueZero(x, y) {
				return x === y
						|| (typeof x === 'number' && typeof y === 'number'
								&& isNaN(x) && isNaN(y));
			}

			// 7. Repeat, while k < len
			while (k < len) {
				// a. Let elementK be the result of ? Get(O, ! ToString(k)).
				// b. If SameValueZero(searchElement, elementK) is true, return
				// true.
				if (sameValueZero(o[k], searchElement)) {
					return true;
				}
				// c. Increase k by 1.
				k++;
			}

			// 8. Return false
			return false;
		}
	});
}

// 标题div的id
var titleElemIds = [ "left_top_title", "left_middle_title",
		"left_bottom_title", "middle_bottom_title", "right_top_title",
		"right_middle_title", "right_bottom_title", "middle_top_title" ];
// 组件内容区div的id
var contentElemIds = [ "left_top_content", "left_middle_content",
		"left_bottom_content", "middle_bottom_content", "right_top_content",
		"right_middle_content", "right_bottom_content", "middle_top_content" ];

var socketArr = {
	"left_top_content" : null,
	"left_middle_content" : null,
	"left_bottom_content" : null,
	"middle_bottom_content" : null,
	"right_top_content" : null,
	"right_middle_content" : null,
	"right_bottom_content" : null,
	"middle_top_content" : null
};// 保存页面socket连接
var mainSocket = null; // 主socket连接

// 各区块当前页面
var currentPages = {
	"left_top_content" : 1,
	"left_middle_content" : 1,
	"left_bottom_content" : 1,
	"middle_bottom_content" : 1,
	"right_top_content" : 1,
	"right_middle_content" : 1,
	"right_bottom_content" : 1,
	"middle_top_content" : 1
};
// 保存各区块echartInstance
var blockDatas = {};
var tabG = "one";

function switchTab(pagenum) {
	var event = {
		"eventType" : "SwitchTab",
		"json" : "{'type' : 'SwitchTab','pagenum' :" + pagenum + "}"
	};
	var command = JSON.stringify(event);
	mainSocket && mainSocket.send(command);
}
$(function() {
	var links = $("#tab a");
	$("#tab_" + tabG).addClass('active').parent().siblings().each(
			function(idx, item) {
				$(item).children().first().removeClass('active');
			});

	links.each(function(idx, item) {
		var selectionId = item.getAttribute("href").split("#")[1];
		item.destination = selectionId;
		item.onclick = function() {
			$(this).addClass('active').parent().siblings().each(
					function(idx, item) {
						$(item).children().first().removeClass('active');
					});
			tabG = this.destination;
			return switchTab(this.destination);
		};

	});

	realTime();
	window.onresize = function() {
		for (elem in currentPages) {
			if (Array.isArray(blockDatas[elem][currentPages[elem]])) {
				blockDatas[elem][currentPages[elem]].forEach(function(item) {
					if (Array.isArray(item)) {
						item && item.forEach(function(currentItem) {
							currentItem.resize();
						});
					} else {
						item && item.resize();
					}
				});
			}
		}
	};
	blockDatas = {
		"left_top_content" : {
			"title" : $("#left_top_title")
		},
		"left_middle_content" : {
			"title" : $("#left_middle_title")
		},
		"left_bottom_content" : {
			"title" : $("#left_bottom_title")
		},
		"middle_bottom_content" : {
			"title" : $("#middle_bottom_title")
		},
		"right_top_content" : {
			"title" : $("#right_top_title")
		},
		"right_middle_content" : {
			"title" : $("#right_middle_title")
		},
		"right_bottom_content" : {
			"title" : $("#right_bottom_title")
		},
		"middle_top_content" : {
			"title" : $("#middle_top_title")
		}
	};

	buildSocket();
	// 开关按钮,默认为开
	$("#toggle").bootstrapSwitch();

	$("#toggle").on('switchChange.bootstrapSwitch', function(e, data) {
		var event = {
			"eventType" : "Toggle",
			"json" : "{'type' : 'Toggle','toggle' :" + data + "}"
		};
		var command = JSON.stringify(event);
		mainSocket.send(command);
	});
});

/**
 * 
 * 页面显示实时时间
 */
function realTime() {
	var currentDate = new Date();
	var date = currentDate.toLocaleDateString();
	var time = currentDate.toLocaleTimeString();

	$("#currenttime").empty().append(date + " " + time);
	setTimeout(realTime, 1000);
}

/**
 * 发送命令
 */
function sendCommond(obj, event) {
	var message = obj.value;
	if (event.keyCode == 13) { // enter键发送
		mainSocket.send(message);
	}
};

// 向服务器发起webSocket连接
function buildSocket() {
	// 判断当前浏览器是否支持WebSocket
	if ('WebSocket' in window) {
		var host = document.location.host;

		// 主通信webSocket
		mainSocket = new WebSocket("ws://" + host
				+ "/IT_OM_MonitorCenter/websocket/major_screen$" + clientid);
		mainSocket.onerror = onError;
		mainSocket.onopen = onOpen;
		mainSocket.onmessage = onMessage;
		mainSocket.onclose = onClose;

		// 构造8个区块的专属通讯webSocket
		contentElemIds.forEach(function(element) {
			var socket = new WebSocket("ws://" + host
					+ "/IT_OM_MonitorCenter/websocket/" + element + "$"
					+ clientid);
			socket.onopen = onOpen;
			socket.onmessage = onMessage;
			socket.onerror = onError;
			socket.onclose = onClose;
			socket.clientid = clientid;
			socketArr[element] = socket;
		});

	} else {
		alert('当前浏览器 Not support websocket');
	}
}

function onClose() {
	setMessageInnerHTML("WebSocket连接关闭");
}
function onError() {
	setMessageInnerHTML("WebSocket连接发生错误");
}

function onOpen() {
	setMessageInnerHTML("WebSocket连接成功");
}

// 消息接收处理函数
function onMessage(message) {
	if (message.data) {
		var data = JSON.parse(message.data); // json字符串转换成js对象
		if (data.messagetype === "CHANGE_COMPONENT") { // 组件切换
			changeComponent(data);
		} else if (data.messagetype === "UPDATE_DATA") { // 数据更新
			updateData(data);
		} else if (data.messagetype === "REDRAW_CHART") { // 重新绘制
			redrawChart(data);
		}
	}
}

/**
 * 根据html元素节点id更新该节点上的echart图形数据
 * 
 * @param elemId
 * @param option
 * @returns
 */
function refreshComponentData(elemId, option) {
	var domElem = document.getElementById(elemId);
	var chart = echarts.getInstanceByDom(domElem);
	if (chart) {
		chart.showLoading();
		chart.setOption(option);
		chart.hideLoading();
	}
}

/**
 * 
 * 刷新页面组件显示的数据
 * 
 * @param blockname
 *            区块div的id值
 * @param pagenum
 *            第几页
 * @param compnum
 *            子组件序号
 * @param data
 *            数据
 */
function refreshComponentDataOld(blockname, pagenum, compnum, option) {
	if (currentPages[blockname] == pagenum && blockDatas[blockname][pagenum]
			&& blockDatas[blockname][pagenum][compnum - 1]) {

		blockDatas[blockname][pagenum][compnum - 1].showLoading();
		blockDatas[blockname][pagenum][compnum - 1].setOption(option);
		blockDatas[blockname][pagenum][compnum - 1].hideLoading();
	}
}
/**
 * 重新绘制组件
 * 
 * @param baseComp
 */
function redrawChartOld(baseComp) {
	var blockname = baseComp.blockname;
	var pagenum = baseComp.pagenum;
	var compnum = baseComp.compnum;
	var option = baseComp.option;
	var js_actual = baseComp.js_actual;
	var legend_data = option.legend.data;
	var type = baseComp.chart_species;

	if (blockname === "middle_top_content") {
		(function() { // 一个闭包函数
			var wrapChart = JSON.parse(baseComp.js_actual);
			var option_base = wrapChart.chart; // 如果chart存在，则为chart;
			clear(option_base);
			blockDatas[blockname][pagenum] = blockDatas[blockname][pagenum]
					|| []; // 赋值为数组
			switch (type) {
			case "条形图":
				var xAxisParam = option.xAxis;
				var yAxisParam = option.yAxis;
				var text = option_base.title.text;
				blockDatas[blockname][pagenum][compnum - 1][wrapChart.div_id] = drawBarChart(
						blockname + "_" + wrapChart.div_id, option_base,
						xAxisParam, yAxisParam, legend_data, option.series,
						text);
				break;
			case "表格":
				blockDatas[blockname][pagenum][compnum - 1][wrapChart.div_id] = drawTableChart(
						blockname + "_" + wrapChart.div_id, option_base,
						legend_data, option.series);
				break;
			default:
				break;
			}

		})();
	} else {
		var option_base = JSON.parse(js_actual).chart || JSON.parse(js_actual); // 如果chart存在，则为chart;
		clear(option_base);

		// 生成区块内需要展示的组件对象
		var compObj = {};
		var elemId = "";
		switch (compnum) {
		case 1:
			elemId = blockname + "_one";
			break;
		case 2:
			elemId = blockname + "_two";
			break;
		case 3:
			elemId = blockname + "_three";
			break;
		default:
			break;
		}

		var text = option_base.title.text;
		var series = option.series;
		if (currentPages[blockname] == pagenum
				&& blockDatas[blockname][pagenum]
				&& blockDatas[blockname][pagenum][compnum - 1]) {

			var instance = blockDatas[blockname][pagenum][compnum - 1];
			instance && isHasMethod(instance, "dispose") && instance.dispose(); // 清除组件

			switch (type) {
			case "曲线图":
				blockDatas[blockname][pagenum][compnum - 1] = drawLineChart(
						elemId, option_base, option.xAxis, option.yAxis,
						legend_data, series, text);
				break;
			case "表格":
				blockDatas[blockname][pagenum][compnum - 1] = drawTableChart(
						elemId, option_base, legend_data, series);
				break;
			case "饼形图":
				blockDatas[blockname][pagenum][compnum - 1] = drawPieChart(
						elemId, option_base, legend_data, series, text);
				break;
			case "条形图":
				blockDatas[blockname][pagenum][compnum - 1] = drawBarChart(
						elemId, option_base, option.xAxis, option.yAxis,
						legend_data, series, text);
				break;
			default:
				break;
			}
		}

	}
}
/**
 * 重新绘制组件
 * 
 * @param baseComp
 */
function redrawChart(baseComp) {
	var blockname = baseComp.blockname;
	var pagenum = baseComp.pagenum;
	var compnum = baseComp.compnum;
	var option = baseComp.option;
	var js_actual = baseComp.js_actual;
	var legend_data = option.legend.data;
	var type = baseComp.chart_species;

	if (blockname === "middle_top_content") {
		(function() { // 一个闭包函数
			var wrapChart = JSON.parse(baseComp.js_actual);
			var option_base = wrapChart.chart; // 如果chart存在，则为chart;
			clear(option_base);
			blockDatas[blockname][pagenum] = blockDatas[blockname][pagenum]
					|| []; // 赋值为数组
			switch (type) {
			case "条形图":
				var xAxisParam = option.xAxis;
				var yAxisParam = option.yAxis;
				var text = option_base.title.text;
				blockDatas[blockname][pagenum][compnum - 1][wrapChart.div_id] = drawBarChart(
						blockname + "_" + wrapChart.div_id, option_base,
						xAxisParam, yAxisParam, legend_data, option.series,
						text);
				break;
			case "表格":
				blockDatas[blockname][pagenum][compnum - 1][wrapChart.div_id] = drawTableChart(
						blockname + "_" + wrapChart.div_id, option_base,
						legend_data, option.series);
				break;
			default:
				break;
			}

		})();
	} else {
		var option_base = JSON.parse(js_actual).chart || JSON.parse(js_actual); // 如果chart存在，则为chart;
		clear(option_base);

		// 生成区块内需要展示的组件对象
		var compObj = {};
		var elemId = "";
		switch (compnum) {
		case 1:
			elemId = blockname + "_one";
			break;
		case 2:
			elemId = blockname + "_two";
			break;
		case 3:
			elemId = blockname + "_three";
			break;
		default:
			break;
		}

		if (currentPages[blockname] == pagenum
				&& blockDatas[blockname][pagenum]
				&& blockDatas[blockname][pagenum][compnum - 1]) {

			var instance = blockDatas[blockname][pagenum][compnum - 1];
			instance && isHasMethod(instance, "dispose") && instance.dispose(); // 清除组件

			switch (type) {
			case "曲线图":
				blockDatas[blockname][pagenum][compnum - 1] = drawChart(elemId,
						option_base, option);
				break;
			case "表格":
				blockDatas[blockname][pagenum][compnum - 1] = drawChart(elemId,
						option_base, option);
				break;
			case "饼形图":
				blockDatas[blockname][pagenum][compnum - 1] = drawChart(elemId,
						option_base, option);
				break;
			case "条形图":
				blockDatas[blockname][pagenum][compnum - 1] = drawChart(elemId,
						option_base, option);
				break;
			default:
				break;
			}
		}

	}
}

/**
 * 
 * 更新数据
 * 
 * @param baseComp
 */
function updateData(baseComp) {
	var blockname = baseComp.blockname;
	var pagenum = baseComp.pagenum;
	var compnum = baseComp.compnum;
	var type = baseComp.type;
	var option = baseComp.option;
	var option_copy = {};
	if (currentPages[blockname] == pagenum) {// 判断所传递的baseComp组件是否在当前页面

		if (blockname === "middle_top_content") {
			(function() { // 一个闭包函数
				switch (type) {
				case "bar":
					var seriescopy = [];// 实例[{"data":[{"name":"DOWN","value":"1"},{"name":"DOWN","value":"2"}]},{"data":[{"name":"UP","value":"36"},{"name":"UP","value":"40"}]}]
					option.series.forEach(function(currentItem, idx) {
						var seriesItem = {};

						seriesItem.data = currentItem.data.map(function(
								currentItem) {// data数组转换，移除currentItem不必要的属性，仅保留name和value
							return {
								"name" : currentItem.name,
								"value" : currentItem.value
							};
						});
						seriescopy.push(seriesItem);
					});
					option_copy.series = seriescopy;
					refreshComponentData(blockname + "_1", option_copy);
					break;
				}
			})();
		} else {

			switch (type) { // 目前仅饼形图（包括圆圈），条形图需只更新数据而不用重新绘制
			case "pie":
				option_copy.series = [ {
					"data" : option.series[0].data
				} ];
				break;
			case "bar":
				var seriescopy = [];// 实例[{"data":[{"name":"DOWN","value":"1"},{"name":"DOWN","value":"2"}]},{"data":[{"name":"UP","value":"36"},{"name":"UP","value":"40"}]}]
				option.series.forEach(function(currentItem, idx) {
					var seriesItem = {};

					seriesItem.data = currentItem.data
							.map(function(currentItem) {// data数组转换，移除currentItem不必要的属性，仅保留name和value
								return {
									"name" : currentItem.name,
									"value" : currentItem.value
								};
							});
					seriescopy.push(seriesItem);
				});
				option_copy.series = seriescopy;
				break;
			default:
				break;
			}
			var elemId = "";
			switch (compnum) {
			case 1:
				elemId = blockname + "_one";
				break;
			case 2:
				elemId = blockname + "_two";
				break;
			case 3:
				elemId = blockname + "_three";
				break;
			default:
				break;
			}
			refreshComponentData(elemId, option_copy);
		}
	}
}
/**
 * 
 * 切换组件
 * 
 * @param message
 */
function changeComponent(message) {
	var blockname = message.blockname; // div名称
	var pagenum = message.pagenum; // 页号
	var chartJsonArr = message.charts; // 组件列表
	var title = message.title; // 标题
	var size = message.size; // 该区域的子组件个数
	if (blockname === "middle_top_content") {
		(function() { // 一个闭包函数
			var compnum = chartJsonArr[0].compnum;

			blockDatas[blockname][pagenum] = blockDatas[blockname][pagenum]
					|| []; // 赋值为数组
			blockDatas[blockname][pagenum][compnum - 1] = drawCompoundChart(
					blockname, chartJsonArr);
		})();
	} else {
		// 准备动作，根据子组件的数目构造相应的子div
		var echart_jsonMap = {};
		chartJsonArr.forEach(function(currentItem, index) {
			switch (currentItem.compnum) {
			case 1:
				echart_jsonMap[blockname + "_one"] = currentItem;
				break;
			case 2:
				echart_jsonMap[blockname + "_two"] = currentItem;
				break;
			case 3:
				echart_jsonMap[blockname + "_three"] = currentItem;
				break;
			default:
				break;
			}
		});

		var subDivArr = [];
		switch (size) {
		case 1:
			for (key in echart_jsonMap) {
				subDivArr.push(format("<div id='%s' class='%s'> </div>", key,
						"block_content_div_one"));
			}
			break;
		case 2:
			for (key in echart_jsonMap) {
				subDivArr.push(format("<div id='%s' class='%s'> </div>", key,
						"block_content_div_two"));
			}
			break;
		case 3:
			for (key in echart_jsonMap) {
				subDivArr.push(format("<div id='%s' class='%s'> </div>", key,
						"block_content_div_three"));
			}
			break;
		}
		$("#" + blockname).empty().append(subDivArr.join(" ")); // 在该blockname表示的div区块中清除已有内容并追加子div

		for (key in echart_jsonMap) { // key有可能为blockname_one/blockname_two/blockname_three
			var compnum = echart_jsonMap[key].compnum;
			var js_actual = echart_jsonMap[key].js_actual;
			var option = echart_jsonMap[key].option;
			blockDatas[blockname][pagenum] = blockDatas[blockname][pagenum]
					|| []; // 赋值为数组
			blockDatas[blockname][pagenum][compnum - 1] = drawChart(key,
					js_actual, option);
		}
	}

	blockDatas[blockname]["title"].empty().append(title);// 更改标题
	currentPages[blockname] = pagenum;
	drawBorder(message);// 绘制边框

}

// 清除option_base中的参数变量
function clear(option_base) {
	if (option_base.series) {
		option_base.series[0].data && (option_base.series[0].data = []);
		option_base.legend.data && (option_base.legend.data = []); // 清除legend中的数据，如果有的话
	}
}

// 绘制复合图形
function drawCompoundChart(elemId, charts) {
	var resultCharts = [];
	var wrapCharts = [];
	charts.forEach(function(currentItem) {
		var wrapChart = JSON.parse(currentItem.js_actual);
		wrapCharts.push({
			"num" : wrapChart.div_id,
			"id" : elemId + "_" + wrapChart.div_id,
			"style" : wrapChart.style,
			"js_actual" : wrapChart.chart,
			"option" : currentItem.option
		});
	});

	var compArr = [];
	wrapCharts.forEach(function(currentItem) {
		compArr.push(format("<div id='%s' style='%s'> </div>", currentItem.id,
				currentItem.style));
	});

	$("#" + elemId).empty().append(compArr.join(" "));

	wrapCharts.forEach(function(currentItem) {
		resultCharts[currentItem.num] = drawChart(currentItem.id,
				currentItem.js_actual, currentItem.option);
	});
	return resultCharts;
}

/**
 * 绘制echart图形，并返回echartInstance实例
 * 
 * @param elemId
 * @param js_actual
 * @param option
 * @returns echartInstance
 */
function drawChart(elemId, js_actual, option) {
	var option_base = typeof js_actual == "string" ? JSON.parse(js_actual)
			: js_actual;
	var color = {
		"green" : "hsl(90,70%,30%)",
		"zongse" : "hsl(160,70%,30%)"
	};
	// option_base = {
	//
	// "col" : {
	// "idColumn" : {
	// "show" : false,
	// "num" : 0
	// },
	// "ImageText" : [ "NO", "NO", "NO", "NO", "NO" ],
	// "backgroundColor" : [ "null", "null", "null", "null", "null",
	// "null" ],
	// "color" : [ "null", "null", "null", "#ffffff", "#ffffff", "null" ],
	//
	// "td_textalign" : [ "center", "Left", "Left", "center", "center",
	// "center" ],
	// "th_textalign" : [ "center", "center", "center", "center",
	// "center", "center" ],
	// "width" : [ 150, 150, 200 ]
	// },
	// "header" : {
	// "fontSize" : "12",
	// "fontStyle" : "normal",
	// "fontWeight" : "bold",
	// "backgroundColor" : "hsl(160,70%,30%)",
	// "height" : "24",
	// "textColor" : "black",
	// "textAlign" : "center"
	// },
	// "height" : 280,
	// "legend" : {
	// "data" : "legend_data"
	// },
	// "margin" : {
	// "backGauge" : "0",
	// "backgroundColor" : "#0B0626",
	// "frameSize" : "1",
	// "frameStyle" : "solid",
	// "frameColor" : "yellow",
	// "hide" : "YES"
	// },
	// "row" : {
	// "backgroundColor" : "#0B0626",
	// "fontSize" : "12",
	// "fontStyle" : "normal",
	// "fontWeight" : "normal",
	// "height" : "20",
	// "oddEven" : "NO",
	// "oddEvenBackgroundColor" : "#0B0626",
	// "textColor" : "white",
	// "textAlign" : "center"
	// },
	// "serialNumberColumn" : "NO",
	// "series" : [ {
	// "type" : "table"
	// } ],
	// "stateIdent" : [ {
	// "USE" : "NO"
	// }, {
	// "USE" : "NO"
	// }, {
	// "USE" : "YES",
	// "displayValue" : "YES",
	// "rule" : [ {
	// "color" : "blue",
	// "image" : "AA.jpg",
	// "state" : "50"
	// }, {
	// "color" : "red",
	// "image" : "CC.jpg",
	// "state" : "80"
	// }, {
	// "color" : "yellow",
	// "image" : "DD.jpg",
	// "state" : "100"
	// } ],
	// "type" : 5
	// } ],
	//
	// "stateIdentUse" : "YES",
	// "table" : {
	// "frameColor" : "#214384",
	// "frameSize" : "1",
	// "frameStyle" : "solid",
	// "style" : 1
	// },
	// "title" : {
	// "text" : ""
	// },
	// "width" : 450
	// };
	clear(option_base);

	var type = option_base.series[0].type;
	var text = option_base.title.text;
	var legend_data = option.legend.data;
	var series = option.series;
	switch (type) {
	case "pie":
		return drawPieChart(elemId, option_base, legend_data, series, text);
		break;
	case "bar":
		var xAxis = option.xAxis;
		var yAxis = option.yAxis;
		return drawBarChart(elemId, option_base, xAxis, yAxis, legend_data,
				series, text);
		break;
	case "line":
		var xAxis = option.xAxis;
		var yAxis = option.yAxis;
		return drawLineChart(elemId, option_base, xAxis, yAxis, legend_data,
				series, text);
		break;
	case "table":
		// if (elemId.startsWith("middle_top_content")) {
		// return drawTableChart(elemId, option_base, legend_data, series);
		// } else {
		return drawTableChart(elemId, option_base, legend_data, series);
		// }
		break;
	case "circle":
		return drawCircleChart(elemId, series, text);
		break;
	}
}

function drawBorder(wrapcomp) {
	var blockname = wrapcomp.blockname;
	var bordeColor = wrapcomp.color;
	var borders = wrapcomp.borders;

	var border = borders.replace(/2/g, "0").split(","); // 2替换为0，2表示不设置边框，故边框宽度为0;
	var borderWidth = border.map(function(currentItem) {
		return currentItem + "px";
	}).join(" ");

	$("#" + blockname).css("border-style", "solid");
	$("#" + blockname).css("border-color", bordeColor);
	$("#" + blockname).css("border-width", borderWidth);

}

function drawLineChart(elemId, option_base, xAxisParam, yAxisParam,
		legend_data, series, title) {
	var chart = getChartInstanceByElementId(elemId);

	var option_content = {};
	option_content.legend = { // 覆写legend数据
		data : legend_data
	};
	var seriescopy = [];
	series.forEach(function(currentItem, idx) {
		var s = {};
		s.data = currentItem.data;
		s.name = currentItem.name;
		s.type = currentItem.type;
		s.label = {
			"normal" : {
				"position" : "insideRight",
				"show" : false
			// 折线上是否显示拐点数字
			}
		};
		seriescopy.push(s);
	});

	option_content.series = seriescopy; // 覆写系列数据

	// 覆写xAxis数据
	if (xAxisParam[0]) {
		option_content.xAxis = {
			type : xAxisParam[0].type,
			splitLine : {
				lineStyle : {
					color : [ "#0E1037" ]
				// 分割线颜色
				}
			}
		};
		xAxisParam[0].data && (option_content.xAxis.data = xAxisParam[0].data);
	}
	// 覆写yAxis数据
	if (yAxisParam[0]) {
		option_content.yAxis = {
			type : yAxisParam[0].type,
			splitLine : {// y轴分隔线样式，与x轴平行
				lineStyle : {
					color : [ "#0E1037" ]
				// 分割线颜色

				}
			}
		};
		yAxisParam[0].data && (option_content.yAxis.data = yAxisParam[0].data);
		yAxisParam[0].max && (option_content.yAxis.max = yAxisParam[0].max);
	}

	chart.showLoading();
	option_base.series = [];
	option_base.legend.data = [];

	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	return chart;
}

function drawBarChart(elemId, option_base, xAxisParam, yAxisParam, legend_data,
		series, title) {
	var chart = getChartInstanceByElementId(elemId);
	var option_content = {
		"legend" : {
			data : legend_data
		}
	};
	var seriescopy = [];
	series.forEach(function(currentItem, idx) {
		var s = {};
		s.data = currentItem.data;
		s.name = currentItem.name;
		s.type = currentItem.type;
		s.stack = "总量"; // 多系列的情况下,设置了stack="总量",则会堆叠显示，若未设置则不堆叠显示
		s.label = {
			"normal" : {
				"position" : "inside",
				"show" : true
			}
		};
		seriescopy.push(s);
	});
	option_content.series = seriescopy;
	if (xAxisParam[0]) {
		option_content.xAxis = {
			type : xAxisParam[0].type
		};
		if (xAxisParam[0].data) {
			option_content.xAxis.data = xAxisParam[0].data;
		}
	}
	if (yAxisParam[0]) {
		option_content.yAxis = {
			type : yAxisParam[0].type
		};
		if (yAxisParam[0].data) {
			option_content.yAxis.data = yAxisParam[0].data;
		}
	}
	chart.showLoading();
	option_base.series = [];
	option_base.legend.data = [];
	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	chart.on("dblclick", function(params) {
		console.log(params.name);
	});
	return chart;

}

// 表格类型的图形
function drawTableChart(elemId, option_base, legend_data, records, title) {
	var table = new Table(document.getElementById(elemId));
	table.name = elemId;
	document.getElementById(elemId).innerHTML = "";

	// console.log(option_base);
	var labelName = option_base.col.labelName
			|| (option_base.col.labelName = []);
	var name = option_base.col.name || (option_base.col.name = []);

	var addSerialNumber = option_base.serialNumberColumn === "YES";
	var data = [];
	legend_data.forEach(function(dataItem, idex) {
		labelName.push(dataItem.labelName);
		name.push(dataItem.name);
	});
	records.forEach(function(currentItem, index) {
		var obj = addSerialNumber ? {
			"number" : index + 1
		} : {};
		var record = currentItem.data.reduce(function(accum, dataItem) {
			accum[dataItem.name] = dataItem.value;
			return obj;
		}, obj);

		data.push(record);
	});
	var data_parse = {
		"Data" : data,
		"Option" : option_base
	};
	table.createTable(data_parse, elemId);
	return table;

}
// 表格类型的图形
function drawTableChart_(elemId, option_base, legend_data, series, title) {
	var chart = getChartInstanceByElementId(elemId);
	var seriescopy = [];
	var size = (series[0] && series[0].data.length) || 0;// 对应行数
	var widthArr = option_base.columns;// 设置各列宽度
	var hasOrderColumn = option_base.order;// 是否设置序号列
	var align = [ "insideLeft", "insideLeft", "inside" ];
	series.forEach(function(currentItem, idx) {
		var width = widthArr[idx];
		// var currenalign=a
		var s = {};
		var data = currentItem.data.map(function(item) {
			return {
				"name" : item.value,
				"value" : width,
				"itemStyle" : {
					normal : {
						color : "transparent",
						borderColor : "#333333",
						borderWidth : 1,
						borderType : "solid"
					}
				},
				label : {
					normal : {
						show : true,
						position : "insideLeft",
						fontWeight : "lighter",
						fontSize : 12,
						formatter : function(e) {
							return e.name;
						},
					}
				}
			};
		});
		data.unshift({
			name : legend_data[idx], // 系列(legend)名作为第一行数据
			value : width,
			itemStyle : {
				normal : {
					color : "transparent",
					borderColor : "#333333",
					borderWidth : 1,
					borderType : "solid"
				},
				label : {
					normal : {
						show : true,
						position : "inside",
						fontWeight : "lighter",
						fontSize : 12,
						formatter : function(e) {
							return e.name;
						},
					}
				}
			}
		});
		s.data = data;
		s.barWidth = "98%";
		s.stack = "总量";
		s.name = currentItem.name;
		s.type = currentItem.type;

		s.label = {
			normal : {
				show : true,
				position : "inside",
				fontWeight : "lighter",
				fontSize : 12,
				formatter : function(e) {

					return e.name;
				}
			}
		};

		seriescopy.push(s);
	});
	if (hasOrderColumn) {
		// 添加序号列
		var orders = {
			"barWidth" : "98%",
			"stack" : "总量",
			"type" : "bar",
			"name" : "序号"
		};
		var orderData = [ {
			name : "序号",
			value : 5,
			itemStyle : {
				normal : {
					color : "transparent",
					borderColor : "#333333",
					borderWidth : 1,
					borderType : "solid"
				}
			}
		} ];
		for (var i = 0; i < size; i++) {
			orderData.push({
				name : i + 1,
				value : 5,
				itemStyle : {
					normal : {
						color : "transparent",
						borderColor : "#333333",
						borderWidth : 1,
						borderType : "solid"
					}
				},
				label : {
					normal : {
						show : true,
						position : "inside",
						fontWeight : "lighter",
						fontSize : 12,
						formatter : function(e) {
							return e.name;
						}
					}
				}
			});
		}
		orders.label = {
			normal : {
				show : true,
				position : "inside",
				fontWeight : "lighter",
				fontSize : 12,
				formatter : function(e) {
					return e.name;
				}
			}
		};
		orders.data = orderData;
		seriescopy.unshift(orders); // 序号列放在第一列
	}

	var option_content = {
		series : seriescopy
	};

	option_base = {
		backgroundColor : "transparent",
		tooltip : {
			trigger : 'axis',
			axisPointer : {
				type : 'shadow'
			},
			formatter : function(params) {
				return "";
			}
		},
		grid : {
			"top" : "5%",
			"left" : "2%",
			"right" : "2%",
			"bottom" : "5%",
			containLabel : true
		},
		xAxis : {
			show : false,
			type : 'value',

		},
		yAxis : [ {
			type : 'category',
			inverse : true,
			position : "right",
			axisLine : {
				postion : "right"
			},
			show : false,
			data : [ "", "", "", "", "", "", "", "", "", "" ]
		} ],
		series : [ {
			name : "序号",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "inside",
					formatter : function(e) {
						// console.log(e);
						if (e.name === "") {
							return "";
						}
						return "{circle|" + e.name + "}";
					},

					rich : {
						circle : {
							width : 20,
							height : 20,
							borderRadius : 10,
							color : "#fff",
							align : "center",
							borderColor : "orange",
							borderWidth : 1,
							backgroundColor : "orange"
						}
					}
				}
			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 1,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		}, {
			name : "时间",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "insideLeft",
					formatter : function(e) {
						// console.log(e);
						return e.name;
					}
				}

			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 4,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		}, {
			name : "方法",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "insideLeft",
					formatter : function(e) {
						return e.name;
					}
				}

			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 10,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		} ]

	};

	chart.showLoading();
	option_base.series = [];
	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	chart.on("dblclick", function(params) {
		console.log(params.name);
	});
	return chart;
}

// 表格类型的图形
function drawTableChart_BC(elemId, option_base, legend_data, series, title) {
	var chart = getChartInstanceByElementId(elemId);
	var seriescopy = [];
	var size = (series[0] && series[0].data.length) || 0;// 对应行数
	var widthArr = option_base.columns;// 设置各列宽度
	var hasOrderColumn = option_base.order;// 是否设置序号列

	series.forEach(function(currentItem, idx) {
		var width = widthArr[idx];
		var s = {};
		var data = currentItem.data.map(function(item) {
			return {
				"name" : item.value,
				"value" : width,
				"itemStyle" : {
					normal : {
						color : "transparent",
						borderColor : "#333333",
						borderWidth : 1,
						borderType : "solid"
					}
				}
			};
		});
		data.unshift({
			name : legend_data[idx], // 系列(legend)名作为第一行数据
			value : width,
			itemStyle : {
				normal : {
					color : "transparent",
					borderColor : "#333333",
					borderWidth : 1,
					borderType : "solid"
				}
			}
		});
		s.data = data;
		s.barWidth = "98%";
		s.stack = "总量";
		s.name = currentItem.name;
		s.type = currentItem.type;

		s.label = {
			normal : {
				show : true,
				position : "insideLeft",
				fontWeight : "lighter",
				fontSize : 12,
				formatter : function(e) {

					return e.name;
				}
			}
		};

		seriescopy.push(s);
	});
	if (hasOrderColumn) {
		// 添加序号列
		var orders = {
			"barWidth" : "98%",
			"stack" : "总量",
			"type" : "bar",
			"name" : "序号"
		};
		var orderData = [ {
			name : "序号",
			value : 5,
			itemStyle : {
				normal : {
					color : "transparent",
					borderColor : "#333333",
					borderWidth : 1,
					borderType : "solid"
				}
			}
		} ];
		for (var i = 0; i < size; i++) {
			orderData.push({
				name : i + 1,
				value : 5,
				itemStyle : {
					normal : {
						color : "transparent",
						borderColor : "#333333",
						borderWidth : 1,
						borderType : "solid"
					}
				}
			});
		}
		orders.label = {
			normal : {
				show : true,
				position : "inside",
				fontWeight : "lighter",
				fontSize : 12,
				formatter : function(e) {
					// console.log(e);
					return e.name;
				}
			}
		};
		orders.data = orderData;
		seriescopy.unshift(orders); // 序号列放在第一列
	}

	var option_content = {
		series : seriescopy
	};

	option_base = {
		backgroundColor : "transparent",
		tooltip : {
			trigger : 'axis',
			axisPointer : {
				type : 'shadow'
			},
			formatter : function(params) {
				return "";
			}
		},
		grid : {
			"top" : "5%",
			"left" : "2%",
			"right" : "2%",
			"bottom" : "5%",
			containLabel : true
		},
		xAxis : {
			show : false,
			type : 'value',

		},
		yAxis : [ {
			type : 'category',
			inverse : true,
			position : "right",
			axisLine : {
				postion : "right"
			},
			show : false,
			data : [ "", "", "", "", "", "", "", "", "", "" ]
		} ],
		series : [ {
			name : "序号",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "inside",
					formatter : function(e) {
						// console.log(e);
						if (e.name === "") {
							return "";
						}
						return "{circle|" + e.name + "}";
					},

					rich : {
						circle : {
							width : 20,
							height : 20,
							borderRadius : 10,
							color : "#fff",
							align : "center",
							borderColor : "orange",
							borderWidth : 1,
							backgroundColor : "orange"
						}
					}
				}
			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 1,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		}, {
			name : "时间",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "insideLeft",
					formatter : function(e) {
						// console.log(e);
						return e.name;
					}
				}

			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 4,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		}, {
			name : "方法",
			type : "bar",
			barWidth : "98%",
			stack : "总量",
			label : {
				normal : {
					show : true,
					position : "insideLeft",
					formatter : function(e) {
						return e.name;
					}
				}

			},
			itemStyle : {
				normal : {
					color : "rgb(172,63,36)"
				}
			},
			data : [ {
				name : "",
				value : 10,
				itemStyle : {
					normal : {
						color : "#fff"
					}
				}
			} ]
		} ]

	};

	chart.showLoading();
	option_base.series = [];
	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	chart.on("dblclick", function(params) {
		console.log(params.name);
	});
	return chart;
}

function drawCircleChart(blockname, series, title) { // 对于圆，series数组大小通常为1（一条记录，两列，第一列为类目，第二列为系列字段，系列名为该字段别名）
	var chart = getChartInstanceByElementId(blockname);
	var series_data = [];
	var text = title.replace("\\n", "\n"); // 组件主标题换行处理

	// 系列数据为空的情形
	if (series.length == 0) {
		series.push({
			"data" : [ 0 ]
		});
	}
	series.forEach(function(currentItem, idx) {
		series_data.push({
			"type" : "pie",
			"data" : currentItem.data,
			"name" : text,
			"itemStyle" : {
				"normal" : {
					"color" : "#FFF200"
				}
			}
		});
	});

	var option_base = {
		"title" : {

		},
		"tooltip" : {
			trigger : 'item',
			formatter : "{c}<br/>{a} "
		},
		"series" : {
			"type" : "pie",
			"data" : [ {
				"itemStyle" : {
					"normal" : {
						"color" : "#FFF200"
					}
				}
			} ],
			radius : [ '85%', '87%' ],
			center : [ '50%', '50%' ],
			itemStyle : {
				normal : {
					show : true
				}
			},
			"label" : {
				"normal" : {
					"show" : true,
					"position" : "center",
					"formatter" : [ '{dd|{c}}', '{a}' ].join("\n\n"),// 系列名a，数据名b，数据值c，百分比d
					"fontSize" : 15,
					"fontWeight" : "bold",
					"color" : "#fff",
					"rich" : {
						dd : {
							"fontSize" : 30,
							"fontWeight" : "bold",
							"color" : "#fff"
						}
					}
				}
			}
		}
	};

	var option_content = {
		"series" : series_data,
	};

	chart.showLoading();
	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	return chart;

}

/**
 * 根据div的id获取该div上的echarts实例，没有则新建一个echarts实例并返回
 * 
 * @param elementId
 * @returns
 */
function getChartInstanceByElementId(elementId) {
	var domElem = document.getElementById(elementId);
	var chart = echarts.getInstanceByDom(domElem);
	if (chart) {
		chart.clear();
	} else {
		chart = echarts.init(domElem);
	}
	return chart;
}

function drawPieChart(elemId, option_base, legend_data, series, title) {
	var chart = getChartInstanceByElementId(elemId);
	var series_data = [];
	series.forEach(function(currentItem, idx) {
		series_data.push({
			"type" : "pie",
			"data" : currentItem.data,
			"name" : currentItem.name,
			"label" : {
				"normal" : {
					"show" : true,
					"formatter" : "{b} : {c} ({d}%)" // 系列名，数据名，数据值，百分比
				}
			}

		});
	});

	var option_content = {
		"legend" : {// 仅替换legend数据，样式在js_actual中配置
			"data" : legend_data
		},
		"series" : series_data
	};
	chart.showLoading();
	// 使用刚指定的配置项和数据显示图表。
	chart.setOption(option_base);
	chart.setOption(option_content);
	chart.hideLoading();
	return chart;

}

/**
 * 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
 */
window.onbeforeunload = function() {
	closeWebSocket();
};

/**
 * 
 * 将消息显示在网页上
 * 
 * @param innerHTML
 */
function setMessageInnerHTML(innerHTML) {
	// console.log(innerHTML);
}

/**
 * 关闭WebSocket连接
 */
function closeWebSocket() {
	socketArr.forEach(function(currentItem) {
		currentItem.close();
	});
	if (!mainSocket) {
		return;
	}
	mainSocket.close();
}

/**
 * 
 * 发送消息
 */
function send() {
	var message = document.getElementById('text').value;
	mainSocket.send(message);
}

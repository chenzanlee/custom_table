/* $(function(){
 onmouse();

 }) */

(function() {
	window.Table = Table;

	function Table(node) {
		this.nodeEle = node;
		this.width = node.clientWidth;
		this.hoverTime = 1000;
		this.title = null;
		this.tr_head;
		this.table = null;
		this.tablecontent = null;
		this.container = null;
		this.rows = null;
		this.colWidth = null;
		this.initialRownum = 0;
		this.initialRowHeight = 0;
		this.initialRowTotalHeight = 0;
		this.initialTableHeight = 0;
		this.headerHeight = 0;
		this.titleHeight = 0;
		this.contentHeight = 0;
		this.contentWidth = 0;
		this.id = "";
		this.Option = null;
		this.Data = null;
		this.resizedColumns;
		this.sumWidth = 0;
	}

	Table.prototype = {

		// 接收json格式字符串，或者对象
		createTable : function(json_DATA, id) {
			this.id = id;
			if (!json_DATA) {
				throw "请提供JSON数据!";
			} else {
				var g_obj = typeof json_DATA == "string" ? JSON
						.parse(json_DATA) : json_DATA;
				this.Option = g_obj.Option;
				this.Data = g_obj.Data;
				this.resizedColumns = this.Option.col.width;
				this.orderColumn();// 处理是否添加序号列
				this.colWidth = this.Option.col.width;
				
				if (this.Option.col.idColumn
						&& this.Option.col.idColumn.show == false
						&& this.Option.col.idColumn.num > 0
						&& isAddSerialNumber) {// 当有id列，且需要添加序号列时，id列需加一，后退一列
					this.Option.col.idColumn = this.Option.col.idColumn + 1;
				}

				this.sumWidth = this.Option.col.width.reduce(function(accum,
						currentValue) {
					return accum + parseInt(currentValue, 10);
				});
				var widthObj = this.newWidth();
				var heightObj = this.newHeight();
				var height = this.nodeEle.offsetHeight;

				var tableHeight = height
						- ((this.Option.title && this.Option.title.height) || 0)
						- this.Option.margin.backGauge * 2;
				var contentHeight = this.Data.length * this.Option.row.height;
				var contentHeight = height
						- ((this.Option.title && this.Option.title.height) || 0)
						- this.Option.margin.backGauge * 2
						- this.Option.header.height;

				this.initialTableHeight = tableHeight;
				this.initialRowHeight = this.Option.row.height;
				this.initialRownum = this.Data.length;
				this.initialRowTotalHeight = contentHeight;

				var container = this.buildContainer(
						widthObj.container_div_width, height);
				var _table = this.buildTable(widthObj.table_div_width,
						tableHeight);
				var title = this.buildTitle();
				var tr_head = this.buildTableHeader(widthObj.header_div_width);
				var tablecontent = this.buildTableContent(
						widthObj.content_div_width, contentHeight);

				_table.appendChild(tr_head);
				_table.appendChild(tablecontent);
				container.appendChild(_table);
				title && container.appendChild(title);
				this.nodeEle.appendChild(container);

			}
		},

		/* 鼠标移动到文本处理参数触碰方法 */
		tMouseover : function() {
			$(document).find(".tb_menu,.table").mouseover(function() {
				$(this).addClass("tb_overtrbg");
				var index = $(this).index();

				// console.log(this);

				// 取得鼠标所在的对象
				$(document).find(".td_col").mouseover(function() {

					$(".td_col").hover(function() {
						hoverTime = setTimeout(function() {

							// t_obj.displayConcealment(this);
						}, 3000);
					}, function() {
						clearTimeout(hoverTime);
					});

				})
			}).mouseout(function() {
				$(this).removeClass("tb_overtrbg");
				var index = $(this).index();
			});
		},

		/* 触发或将函数绑定到被选元素的点击事件 */
		tClick : function(callback) {
			$(document).find("._div_tr").click(function() {
				callback(this);
			});
		},

		/* 触发或将函数绑定到被选元素的双击事件 */
		tDblclick : function(callback) {
			console.log("tDblclick", this);
			var elements = $(document).find("._div_tr");
			console.log("elements", elements);
			elements.each(function(index, item) {
				// console.log("item");
				item.ondblclick = callback;
			});

			/*
			 * $(document).find("._div_tr").dblclick(function(){ //var t_index =
			 * $(this).index(); //var t_value = $(this).attr("value"); var
			 * rowJson = t_obj.getRowObj(this);
			 * 
			 * 
			 * console.log(rowJson); })
			 */
		},

		/* 显示鼠标所在单元格内的内容，通过”悬浮标签“来显示 */
		displayConcealment : function(obj) {

			console.log("====开始==========================================");
			console.log(obj);
			console.log("====结束==========================================");
		},

		/* 取行内容，返回一串选择行所包含的列的JSON文本 */
		getRowObj : function(obj) {

			var rowJson = {};
			var this_obj = $(obj).find("div");

			// console.log(this_obj);
			for (var i = 0, len = this_obj.length; i < len; i++) {

				var rowObj = this_obj[i];

				var rowkeyName = rowObj.id;
				var rowValue = rowObj.value;

				rowJson[rowkeyName] = rowValue;

			}

			return rowJson;
		},

		/* 调整组件宽度 */
		BBBBBB : function(width) {

		},
		newHeight : function() {
		},
		newWidth : function() {
			var width = this.nodeEle.offsetWidth;
			var widthObj = {
				"container_div_width" : 0,// container的宽度(使用盒子模型计算，包含border)
				"columns" : [], // 各内容列div宽度(包含border)
				"row_div_width" : 0, // tr宽度(包含border)
				"table_div_width" : 0, // table_div的宽度(包含border)
				"content_div_width" : 0,// 内容div的宽度(包含border)
				"scale" : 1,// 伸缩比
			};
			var colWidthArr = this.colWidth;
			var tableWidth = width - 2 * this.Option.margin.backGauge;

			// 设置内容区域宽度：
			// 当行设置的列宽和大于表格可视区域宽度时，则将内容区域设置为行宽，由于大于表格宽度，此时出现滚动条；当行设置的宽度和小于表格可视区域的宽度时，则拉伸各列，不出现滚动条
			var contentWidth = (tableWidth < this.sumWidth) ? this.sumWidth
					: tableWidth - 2 * this.Option.table.frameSize;// (table的左右边框)
			var widthShrink = contentWidth / this.sumWidth;

			var currentWidthArr = colWidthArr.map(function(width) {
				return width * widthShrink;
			});
			var resizeRowWidth = currentWidthArr.reduce(function(accu, item) {
				return accu + item;
			});
			widthObj.container_div_width = width;
			widthObj.table_div_width = tableWidth;// 横轴滚动条
			widthObj.content_div_width = contentWidth;
			widthObj.header_div_width = resizeRowWidth;
			widthObj.row_div_width = resizeRowWidth;
			widthObj.columns = currentWidthArr;
			widthObj.scale = widthShrink;
			console.log("width: ", width, "tableWidth: ", tableWidth,
					"contentWidth", contentWidth, " resizeRowWidth: ",
					resizeRowWidth);
			return widthObj;
		},
		/* 自动调整组件宽度 */
		resize : function() {
			var container = this.nodeEle;
			var widthObj = this.newWidth();

			this.container.style.width = widthObj.container_div_width + "px";// container与table为可视区域
			this.table.style.width = widthObj.table_div_width + "px";

			if (widthObj.scale > 1) {// 当表头设置的宽度和小于表格整体宽度时，按比例拉伸各列
				this.tablecontent.style.width = widthObj.content_div_width
						+ "px";// tablecontent,tr_head宽度与内容实际宽度一致
				this.tr_head.style.width = widthObj.header_div_width + "px";
				$(this.tr_head).find(".th_column").each(
						function(index, currentItem) {
							currentItem.style.width = widthObj.columns[index]
									+ "px";
						});
				this.rows.forEach(function(currentItem, index) {
					currentItem.style.width = widthObj.row_div_width + "px";
					$(currentItem).find(".td_col").each(function(idx, column) {
						column.style.width = widthObj.columns[idx] + "px";
					});

				});
			}

			// 高度调整
			var height = container.offsetHeight;
			$(this.container).height(height);
			var title_height = this.titleHeight;
			var head_height = this.headerHeight;
			var _div_table_content = height - title_height - head_height;
			var table_height = height - title_height
					- this.getMargin(this.table, "marginTop")
					- this.getMargin(this.table, "marginBottom");

			$(this.table).height(table_height);

			$(this.tablecontent).height(_div_table_content);
			// console.timeEnd("resize:");
		},
		buildContainer : function(width, height) {
			console.log("buildContainer width:", width, "height:", height);
			if (!this.Option.margin) {
				return;
			}
			var outerFrameBorder = this.Option.margin.hide !== "YES" ? this.Option.margin.frameSize
					: 0;// 是否添加外边距
			var margin = {
				"backGauge" : this.Option.margin.backGauge,
				"frameStyle" : this.Option.margin.frameStyle,
				"frameColor" : this.Option.margin.frameColor,
				"backgroundColor" : this.Option.margin.backgroundColor
			};
			/* 生成表外边框 */
			var outerFrameStyle = [
					format("height:%spx;", height),
					format("width:%spx;", width),
					format("background-color:%s;", margin.backgroundColor),
					format("border:%spx %s %s;", outerFrameBorder,
							margin.frameStyle, margin.frameColor),
					format("position:%s;", "relative") ].join("");
			/* 生成外边框 */

			var container = document.createElement("div");
			container.id = "_div_table_container";
			container.className = "_div_table_container";
			container.setAttribute("style", outerFrameStyle);
			this.container = container;
			return container;
		},
		format : function() {
			var args = [].slice.call(arguments);
			var initial = args.shift();
			function replacer(text, replacement) {
				return text.replace("%s", replacement);
			}
			return args.reduce(replacer, initial);

		},
		buildTitle : function() {
			if (!this.Option.title) {
				return;
			}
			var title = this.Option.title
					&& {
						"text" : this.Option.title.text || "",
						"height" : this.Option.title.height || 0,
						"size" : this.Option.title.size || 0,
						"textColor" : this.Option.title.textColor || "",
						"fontWeight" : this.Option.title.fontWeight || 0,
						"fontStyle" : this.Option.title.fontStyle || "bold",
						"textAlign" : this.Option.title.textAlign || "center",
						"backgroundColor" : this.Option.title.backgroundColor
								|| "white"
					};
			var titleStyle = [ format("height:%spx;", title.height),
					format("line-height:%spx;", title.height),
					format("text-align:%s;", title.textAlign),
					format("font-size:%spx;", title.size),
					format("font-weight:%s;", title.fontWeight),
					format("font-style:%s;", title.fontStyle),
					format("color:%s;", title.textColor),
					format("background-color:%s;", title.backgroundColor) ]
					.join("");
			var titleNode = document.createElement("div");
			this.title = titleNode;
			this.titleHeight = title.height;
			titleNode.className = "div_title_table";
			titleNode.id = "div_title_table";
			titleNode.setAttribute("style", titleStyle);
			titleNode.innerHTML = "&nbsp" + title.text;
			return titleNode;
		},

		buildTable : function(width, height) {
			console.log("buildTable width:", width, "height:", height);
			var table = {
				"frameSize" : this.Option.table.frameSize,
				"frameStyle" : this.Option.table.frameStyle,
				"frameColor" : this.Option.table.frameColor,
				"style" : this.Option.table.style
			};

			var tableBorderStyle = [
					format("height:%spx;", height),
					format("width:%spx;", width),
					format("margin-left:%spx;", this.Option.margin.backGauge),
					format("margin-right:%spx;", this.Option.margin.backGauge),
					format("margin-top:%spx;", this.Option.margin.backGauge),
					format("margin-bottom:%spx;", this.Option.margin.backGauge),
					format("position:%s;", "absolute"),
					format("border:%spx %s %s;", table.frameSize,
							table.frameStyle, table.frameColor) ].join("");
			var table = document.createElement("div");
			this.table = table;
			table.className = "_div_table";
			table.id = "_div_table";
			table.setAttribute("style", tableBorderStyle);
			return table;

		},

		buildLinesStyle : function() {
			var linesStyle = {
				"longitudinalLine" : "",// 竖直的线
				"transverseLine" : "" // 水平的线
			};
			switch (this.Option.table.style) {
			case 2:
				break;
			case 3: // 待实现
				break;
			default:// 普通风格
				linesStyle.longitudinalLine = format(
						"border-right:%spx %s %s;",
						this.Option.table.frameSize,
						this.Option.table.frameStyle,
						this.Option.table.frameColor);
			}
			return linesStyle;
		},
		buildTableHeader : function(width) {
			console.log("build table header width:", width);
			/* 生成表头 */
			var header = {
				"height" : this.Option.header.height,
				"fontSize" : this.Option.header.fontSize,
				"fontWeight" : this.Option.header.fontWeight,
				"fontStyle" : this.Option.header.fontStyle,
				"textAlign" : this.Option.header.textAlign,
				"textColor" : this.Option.header.textColor,
				"backgroundColor" : this.Option.header.backgroundColor
			};

			var rowStyle = [
					format("width:%spx", width),
					format("background:%s", header.backgroundColor),
					format("text-align:%s", header.textAlign),
					format("font-size:%spx", header.fontSize),
					format("font-weight:%s", header.fontWeight),
					format("font-style:%s", header.fontStyle),
					format("color:%s", header.textColor),
					format("border-bottom:%spx %s %s",
							this.Option.table.frameSize,
							this.Option.table.frameStyle,
							this.Option.table.frameColor),
					format("line-height:%spx", header.height), "" ].join(";");
			var linesStyle = this.buildLinesStyle();
			var colStyle = [ format("height:%spx;", header.height),
					format("background:%s;", header.backgroundColor),
					linesStyle.longitudinalLine ].join("");
			var tr_head = document.createElement("div");
			this.tr_head = tr_head;
			this.headerHeight = header.height;
			tr_head.className = "_div_tr_head";
			tr_head.id = "_div_tr_head";
			tr_head.setAttribute("style", rowStyle);
			var col = this.Option.col;
			var columns = this.resizedColumns;
			col.labelName.forEach(function(currentValue, index) {
				var th = document.createElement("div");
				th.className = "th_column";
				th.innerHTML = currentValue;
				th.setAttribute("style", [ format("%s", colStyle),
						format("width:%spx;", columns[index]),
						format("text-align:%s;", col.th_textalign[index]) ]
						.join(""));
				tr_head.appendChild(th);
			})
			return tr_head;

		},
		buildTableContent : function(width, height) {
			console.log("build table content: width: ", width, "height: ",
					height);
			var Option = this.Option;
			var Data = this.Data;
			var columns = this.resizedColumns;
			var linesStyle = this.buildLinesStyle();
			var row = {
				"height" : Option.row.height,
				"fontSize" : Option.row.fontSize,
				"fontWeight" : Option.row.fontWeight,
				"fontStyle" : Option.row.fontStyle,
				"textAlign" : Option.row.textAlign,
				"textColor" : Option.row.textColor,
				"oddEven" : Option.row.oddEven,
				"backgroundColor" : Option.row.backgroundColor,
				"oddEvenBackgroundColor" : Option.row.oddEvenBackgroundColor
			};
			var contentBorderStyle = [ format("width:%spx;", width),
					format("height:%spx;", height) ].join("");

			var colStyle = [ format("height:%spx;", row.height),
					linesStyle.longitudinalLine ].join("");

			var rowStyle = [
					format("width:%spx;", width),
					format("line-height:%spx;", row.height),
					format("text-align:%s;", row.textAlign),
					format("font-size:%spx;", row.fontSize),
					format("font-weight:%s;", row.fontWeight),
					format("font-style:%s;", row.fontStyle),
					format("color:%s;", row.textColor),
					format("background-color:%s;", row.backgroundColor),
					format("border-bottom:%spx %s %s;", Option.table.frameSize,
							Option.table.frameStyle, Option.table.frameColor) ]
					.join("");

			var doubleStyle = [ format("background-color:%s;",
					row.oddEvenBackgroundColor) ].join("");

			var barGraphStyle = [ format("height:%spx;", row.height - 4),
					format("line-height:%spx;", row.height - 4) ].join("");

			/* 生成内容外边框 实现内容滚动，表头不动效果 */
			var tablecontent = document.createElement("div");
			this.tablecontent = tablecontent;
			tablecontent.className = "_div_table_content";
			tablecontent.id = "_div_table_content";
			tablecontent.setAttribute("style", contentBorderStyle);

			/* 生成表格内容 */
			/* 生成行 */
			var rows = [];
			this.rows = rows;
			Data
					.forEach(function(dataItem, index) {
						var tr = document.createElement("div");
						rows.push(tr);
						tr.setAttribute("class", "_div_tr tb_menu");
						tr.setAttribute("style", rowStyle);

						if (row.oddEven == "YES" && index % 2) {
							tr.setAttribute("class", tr.getAttribute("class"));
							tr.setAttribute("style", rowStyle + doubleStyle);
						}
						var numOfcolumn = Option.col.labelName.length;
						/* 生成列 */
						for (var j = 0; j < numOfcolumn; j++) {
							if (Option.col.idColumn - 1 == j) {// 将id值保存到tr的value处
								tr.value = dataItem[Option.col.name[j]];
								continue;
							}
							var td = document.createElement("div");
							td.className = "td_col";
							var col = {
								"name" : Option.col.name[j],
								"color" : Option.col.color[j] ? format(
										"color:%s;", Option.col.color[j]) : "",
								"backgroundColor" : Option.col.backgroundColor[j] ? format(
										"background:%s;",
										Option.col.backgroundColor[j])
										: ""
							};

							var value = dataItem[col.name];
							td.id = col.name;
							td.value = value;

							td.setAttribute("style", colStyle + col.color
									+ col.backgroundColor + "text-align:"
									+ Option.col.td_textalign[j] + ";width:"
									+ columns[j] + "px");

							/* 处理指定规则的行标识样式 */
							var IdentObj = Option.stateIdent;
							var stateIdentUse = Option.stateIdentUse;
							var spanStyle = "";
							var spanValue = "";
							var displayState = 1;
							if (stateIdentUse == "YES"
									&& IdentObj.length == numOfcolumn) {
								if (IdentObj[j].USE == "YES") {
									var identType = IdentObj[j].type;
									var identBackgroundColor = "";
									var identImage = "";
									var ruleLength = IdentObj[j].rule.length;
									var RValue = 0;

									if (ruleLength == 1) {// 只有一条规则时，通用
										identBackgroundColor = IdentObj[j].rule[0].color;
										identImage = "/IT_OM_MonitorCenter/images/bar/"
												+ IdentObj[j].rule[0].image;

									} else {// 多条规则时，根据标识类型区别处理
										if (identType == 5) {
											var Last_RValue = 0;
											for (var k = 0, s = ruleLength; k < s; k++) {
												RValue = parseInt(IdentObj[j].rule[k].state);

												if (value > Last_RValue
														&& value <= RValue) {
													identBackgroundColor = IdentObj[j].rule[k].color;
													identImage = "/IT_OM_MonitorCenter/images/bar/"
															+ IdentObj[j].rule[k].image;

													break;
												} else {
													Last_RValue = RValue;
												}
											}

										} else {
											for (var k = 0, len = ruleLength; k < len; k++) {
												var Istate = IdentObj[j].rule[k].state;
												if (value == Istate) {
													identColor = IdentObj[j].rule[k].color;
													identImage = "/IT_OM_MonitorCenter/images/bar/"
															+ IdentObj[j].rule[k].image;
													break;
												}
											}

										}
										// console.log(ruleLength,identBackgroundColor,identImage);
									}

									/* 将确定好的样式，根据指定的形式，生成HTML代码 */
									switch (identType) {
									case 1:
										tr.style.backgroundColor = identColor;
										break;
									case 2:
										td.style.backgroundColor = identColor;
										break;
									case 3:
										td.style.color = identColor;
										break;
									case 4:
										var barGraph = document
												.createElement("img");
										barGraph.className = "tb_Istate";
										barGraph.id = j;
										barGraph.src = identImage;
										barGraph
												.setAttribute("style",
														"height:14px;line-height:14px;width:14px;margin-bottom:-2px");
										td.appendChild(barGraph);

										td.style.color = identColor;
										break;

									case 5:
										var barGraph = document
												.createElement("img");
										barGraph.className = "tb_barGraph ";
										barGraph.src = identImage;
										barGraph.setAttribute("style",
												barGraphStyle
														+ format("width:%s%",
																value));
										td.appendChild(barGraph);
										displayState = 2;
										if (IdentObj[j].displayValue == "YES") {
											spanStyle = "Style='margin-left:"
													+ (columns[j] / 2 - 5)
													+ "px'"
											spanValue = value + "%"
											displayState = 3;
										}
										td.style.position = "relative";

										break;
									default:
									}
								}
							}

							displayState == 1
									&& (td.innerHTML += format(
											"<span id='%s' value='%s' %s class='tb_JSt_content' >%s</span>",
											col.name, value, spanStyle, value));

							displayState == 3
									&& (td.innerHTML += format(
											"<span id='%s' value='%s' %s class='tb_JSt_content2' >%s</span>",
											col.name, value, spanStyle,
											spanValue));
							tr.appendChild(td);
						}
						tablecontent.appendChild(tr);

					});
			return tablecontent;

		},
		isShowIdColumn : function() {

		},
		// 序号列处理
		orderColumn : function() {
			var isAddSerialNumber = this.Option.serialNumberColumn === "YES";
			if (isAddSerialNumber) {
				!this.Option.col.labelName.includes("序号")
						&& this.Option.col.labelName.unshift("序号");
				this.Option.col.labelName.length === this.Option.col.name.length + 1
						&& this.Option.col.name.unshift("number");
				this.Option.col.labelName.length === this.Option.col.td_textalign.length + 1
						&& this.Option.col.td_textalign.unshift("center");
				this.Option.col.labelName.length === this.Option.col.th_textalign.length + 1
						&& this.Option.col.th_textalign.unshift("center");
				this.Option.col.labelName.length === this.Option.col.width.length + 1
						&& this.Option.col.width.unshift(30);
			}
		},
		getMargin : function(div, location) {
			var s = div[location];
			if (!s) {
				return 0;
			}
			var end = s.indexOf("px");
			return parseInt(s.substring(0, end));
		}

	};
}());

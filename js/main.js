/**
 * Created by Administrator on 2017/2/20.
 */

window.jQuery = $;

(function() {
    "use strict"

    var _util = (function() {
        var prefix = "zzr_reading_",
            storageGetter = function(key) {
                return localStorage.getItem( prefix + key );
            },
            storageSetter = function(key, value) {
                return localStorage.setItem( prefix + key, value);
            },
            getJSONP = function(url, callback) {
                $.jsonp({
                    url: url,
                    cache: true,
                    callback: "duokan_fiction_chapter",
                    success: function(result) {
                        var data = $.base64.decode(result),
                            jsonData = decodeURIComponent(escape(data));
                        callback(jsonData);
                    }
                })
            };

        return {
            storageGetter: storageGetter,
            storageSetter: storageSetter,
            getJSONP: getJSONP
        }
    })();

    var _dom = {
            win: $(window),
            body: $("body"),
            topNav: $(".top-nav"),
            bottomNav: $(".bottom-nav"),
            fictionStyle: $(".fiction-style"),
            fictionContent: $(".fiction-content"),
            circle: $(".circle"),
            bottomBtnNight: $("#bottomBtnNight"),
            bottomBtnDay: $("#bottomBtnDay")
        },
        _initFontSize = parseFloat(_util.storageGetter("fontSize")),
        _initFictionBgc = _util.storageGetter("fictionBGC"),
        _initIsNight = _util.storageGetter("isNight"),
        _initDaytimeBgc = _util.storageGetter("daytimeBGC"),
        _dataInteractionMode;

    var main = function() {
        /*  主函数入口   */
        _dataInteractionMode = dataInteraction();
        initialCss();
        _dataInteractionMode.init(htmlRender(_dom.fictionContent));
        eventHandler();
    };

    function initialCss() {
        /* 样式初始化函数 */

        //初始化字体大小
        if (!_initFontSize) {
            _initFontSize = 1.6;
        }
        _dom.fictionContent.css("fontSize", _initFontSize + "rem");

        //初始化背景色
        if (_initFictionBgc) {
            var fictionClassName = _dom.body.attr("class").match(/bgc-color-\w+/).toString();
            _dom.body.removeClass(fictionClassName).addClass(_initFictionBgc);

            //初始化背景色选择环
            _dom.circle.each(function(index, item) {
                $(item).removeClass("bgc-action");

                if ($(item).hasClass(_initFictionBgc)) {
                    $(item).addClass("bgc-action");
                }
            })
        } else {
            _initFictionBgc = "bgc-color-white";
            _util.storageSetter("fictionBGC", _initFictionBgc);
        }


        //初始化夜间模式设置
        if (_initIsNight === "true" && _initIsNight) {
            _initIsNight = true;
            _dom.bottomBtnDay.show();
            _dom.bottomBtnNight.hide();
        } else {
            _initIsNight = false;
            _util.storageSetter("isNight", _initIsNight);
            _dom.bottomBtnNight.show();
            _dom.bottomBtnDay.hide();
        }
        if (!_initDaytimeBgc) {
            _initDaytimeBgc = _util.storageGetter("fictionBGC");
            _util.storageSetter("daytimeBGC", _initDaytimeBgc)
        }
    }



    function dataInteraction() {
        /* 数据交互函数 */

        var chapterId = parseInt(_util.storageGetter("chapterId")),
            chapterTotal;

        var init = function(UIcallback) {
            getChaptersInfo()
                .then(function() {
                    return getTextContent();
                })
                .then(function(data) {
                    UIcallback && UIcallback(data);
                });
        };

        var getChaptersInfo = function() {
            return new Promise(function(resolve, reject) {
                $.get("/test/web app/data/chapter.json", function(data) {
                    if (parseInt(data.result) === 0) {
                        if (chapterId === null || isNaN(chapterId)) {
                            chapterId = parseInt(data.chapters[1].chapter_id);
                            _util.storageSetter("chapterId", chapterId);
                        }
                        chapterTotal = parseInt(data.chapters.length);
                        resolve();
                    } else {
                        reject();
                    }
                })
            })
        };

        var getTextContent = function() {
            return new Promise(function(resolve, reject) {
                $.get("/test/web app/data/data" + chapterId + ".json", function(data) {
                    if (parseInt(data.result) === 0) {
                        var url = data.jsonp;
                        _util.getJSONP(url, function(data) {
                            resolve(data);
                        })
                    } else {
                        reject({message: "error"});
                    }
                })
            });
        };

        var preChapter = function(UIcallback) {
            if (chapterId > 1) {
                chapterId -= 1;
                _util.storageSetter("chapterId", chapterId);
                getTextContent().then(function(data) {
                    UIcallback && UIcallback(data);
                })
            }
        };

        var nextChapter = function(UIcallback) {
            if (chapterId < chapterTotal) {
                chapterId += 1;
                _util.storageSetter("chapterId", chapterId);
                getTextContent().then(function(data) {
                    UIcallback && UIcallback(data);
                })
            }
        };
        return {
            init: init,
            preChapter: preChapter,
            nextChapter: nextChapter
        }
    }

    function htmlRender(wrap) {
        /* 将获取的数据渲染 */

        function dealData(jsonData) {
            var jsonObj = JSON.parse(jsonData);
            var htmlContent = "<h4>" + jsonObj.t + "</h4>";
            for(var i=0, len=jsonObj.p.length; i<len; i++){
                htmlContent += "<p>" + jsonObj.p[i] + "</p>";
            }
            return htmlContent;
        }

        return function(jsonData) {
            wrap.html(dealData(jsonData));
        }

    }

    function eventHandler() {
        /*  事件绑定函数   */


        /*上下导航弹出事件*/

        //中间屏幕点击触发
        $(".mid-area").click(function() {
            if (_dom.topNav.css("display") === "none") {
                _dom.topNav.show();
                _dom.bottomNav.show();
            } else {
                _dom.topNav.hide();
                _dom.bottomNav.hide();
                _dom.fictionStyle.hide();
                $("#bottomBtnFont > .iconfont").removeClass("font-color-cheng");
            }
        });

        //滚动条触发
        _dom.win.scroll(function() {
            _dom.topNav.hide();
            _dom.bottomNav.hide();
            _dom.fictionStyle.hide();
            $("#bottomBtnFont > .iconfont").removeClass("font-color-cheng");
        });


        /*下导航点击触发事件*/

        //字体按钮触发
        $("#bottomBtnFont").click(function() {
            if (_dom.fictionStyle.css("display") === "none") {
                _dom.fictionStyle.show();
                $("#bottomBtnFont > .iconfont").addClass("font-color-cheng");
            } else {
                _dom.fictionStyle.hide();
                $("#bottomBtnFont > .iconfont").removeClass("font-color-cheng");
            }
        });

        //字体大小触发
        $("#fontBigger").click(function() {
            if (_initFontSize <= 2) {
                _initFontSize += 0.1;
            }
            _dom.fictionContent.css("fontSize", _initFontSize + "rem");
            _util.storageSetter("fontSize", _initFontSize);
        });
        $("#fontSmaller").click(function() {
            if (_initFontSize >= 1.2) {
                _initFontSize -= 0.1;
            }
            _dom.fictionContent.css("fontSize", _initFontSize + "rem");
            _util.storageSetter("fontSize", _initFontSize);
        });

        //背景色触发
        function changeBgc(obj) {
            var fictionBgc = _dom.body.attr("class").match(/bgc-color-\w+/).toString(),
                objBgc = obj.attr("class").match(/bgc-color-\w+/).toString();
            if (fictionBgc !== objBgc) {
                _dom.body.removeClass(fictionBgc).addClass(objBgc);
                _util.storageSetter("fictionBGC", objBgc);
            }

            _dom.circle.removeClass("bgc-action");
            obj.addClass("bgc-action");
        }

        _dom.circle.click(function() {
            changeBgc($(this));
            if (_initIsNight && (!$(this).hasClass("bgc-color-night"))) {
                _initIsNight = false;
                _util.storageSetter("isNight", _initIsNight);
                _dom.bottomBtnNight.show();
                _dom.bottomBtnDay.hide();
            } else if ((!_initIsNight) && $(this).hasClass("bgc-color-night")) {
                _initIsNight = true;
                _util.storageSetter("isNight", _initIsNight);
                _dom.bottomBtnDay.show();
                _dom.bottomBtnNight.hide();
            }
        });

        //夜间模式触发
        $(".day-night").click(function() {
            if (!_initIsNight) {
                _initIsNight = true;
                _initDaytimeBgc = _util.storageGetter("fictionBGC");
                _util.storageSetter("isNight", _initIsNight);
                _util.storageSetter("daytimeBGC", _initDaytimeBgc);
                changeBgc($(".bgc-color-night"));
                _dom.bottomBtnDay.show();
                _dom.bottomBtnNight.hide();
            } else {
                _initIsNight = false;
                _util.storageSetter("isNight", _initIsNight);
                changeBgc($("."+_initDaytimeBgc));
                _dom.bottomBtnNight.show();
                _dom.bottomBtnDay.hide();
            }
        });

        /* 上下章节翻页事件触发 */
        $(".pre-button").click(function() {
            _dataInteractionMode.preChapter(htmlRender(_dom.fictionContent));
            _dom.body.scrollTop(0);
        });

        $(".next-button").click(function() {
            _dataInteractionMode.nextChapter(htmlRender(_dom.fictionContent));
            _dom.body.scrollTop(0);
        });
    }
    main();
})();
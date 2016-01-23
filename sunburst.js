//utilities
// array helper sum function
Array.prototype.sum = function (prop) {
    var total = 0
    for (var i = 0, _len = this.length; i < _len; i++) {
        total += this[i][prop]
    }
    return total
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

//color utilities
var hwColor = d3.scale.ordinal().range(['#940142', '#940162', '#d53e4f', '#d51e4f', '#f46d43', '#fd1d43', '#fdae61', '#fda2d1', '#fee08b', '#f6faaa']);
var quizColor = d3.scale.ordinal().range(['#6b486b', '#7ba888', '#6bc8a1', '#7b6888', '#8a89a6', '#8489a6']);
var finalColor = d3.scale.ordinal().range(['#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb']);
var testColor = d3.scale.ordinal().range(['#ba596a', '#ef6a81', '#f495a6', '#f49aaa']);

function drawMulti(width, height, padding) {
    //nitialize svg
    var svg = d3.select('#multi-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g');

    var xRange = 42
    var yRange = 105;

    //initialize xScale
    var xScale = d3.scale.linear()
        .domain([1, xRange])
        .range([0 + padding, width - padding]);

    //initialize yScale
    var yScale = d3.scale.linear()
        .domain([yRange, 20])
        .range([0 + padding, height - padding]);

    //draw axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10);

    svg.append('g')
        .attr('class', 'axis')
        .attr('id', 'xaxis')
        .attr('transform', 'translate(0,' + (height - padding) + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'axis')
        .attr('id', 'yaxis')
        .attr('transform', 'translate(' + padding + ', 0)')
        .call(yAxis);


    //initialize placeholder for paths
    for (i = 0; i < 23; i++) {
        var line = d3.svg.line()
            .interpolate("cardinal")
            .x(function (d) {
                return xScale(d.day);
            })
            .y(function (d) {
                return yScale(d[i]);
            });

        svg.append('g')
            .attr('class', 'lines')
            .append('path')
            .attr('id', 'line' + i)
            .attr('class', 'line-black')
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            .attr("d", line(multiArray))
            .on("mouseover", function () {
                d3.select(this).style("stroke", "ffcc00").style('stroke-width', 6);
                d3.select('#rect' + this.id.slice(4)).style("fill", "ffcc00");

            })
            .on("mouseleave", function () {
                d3.select('#rect' + this.id.slice(4)).style("fill", "black");
                d3.select(this).style("stroke", "black").style('stroke-width', 1);
            });

    }

}


function updateSunburst(stuindex, width, height) {
    var root = getFormattedData(dataSet, stuindex);
    var node = root;
    var radius = Math.min(width, height) / 2.4;
    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    var y = d3.scale.pow().exponent(0.44)
        .range([0, radius]);
    var color = function (d) {
        if (d.name == 'homework') {
            if (typeof d.children != 'undefined') {
                return '#d51e4f';
            }
            return hwColor(d.grade);
        }
        if (d.name == 'test') {
            if (typeof d.children != 'undefined') {
                return '#ef6a81';
            }
            return testColor(d.grade);
        }
        if (d.name == 'quizes') {
            if (typeof d.children != 'undefined') {
                return '#d51e4f';
            }
            return quizColor(d.grade);
        }
        if (d.name == 'final') {
            if (typeof d.children != 'undefined') {
                return '#8a80e1';
            }
            return finalColor(d.grade);
        }
    }


    //initialize svg
    var svg = d3.select("#sunburst").select("svg")
        .select("g");

    //initialize explantion bar
    var explanation = svg.select("#explanation");

    //initialize partition
    var partition = d3.layout.partition()
        .sort(null)
        .value(function (d) {
            return 1;
        });

    //initialize arc function
    var arc = d3.svg.arc()
        .startAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        })
        .innerRadius(function (d) {
            return Math.max(0, y(d.y));
        })
        .outerRadius(function (d) {
            var gradeAmp = 0;
            return gradeAmp + Math.max(0, y(d.y + d.dy));
        });

    //draw the path graph
    var path = svg.datum(root).selectAll("path")
        .data(partition.value(function (d) {
            return d.size;
        }).nodes);
    path.attr("d", arc)
        .style("fill", function (d) {
            if (d.depth == 0) {
                // centre transparent
                return 'transparent';
            }
            return color(d);
        })
        .style("opacity", 1);
    //click for zoom
    svg.selectAll('.sunburst-path')
        .on("click", click)
        .on("mouseover", function (d) {
            if (d.depth == 0) {
                //centre as leaving area
                mouseleaveinstant(d);
            } else {
                //over for display data
                mouseover(d);
            }
        })
        .each(stash);

    //container as the leaving area
    d3.select("#sunburstcontainer").on("mouseleave", mouseleave);

    //click for zoom
    function click(d) {
        disableMouseTransition();
        var temp = node;
        node = d;
        svg.selectAll('.sunburst-path')
            .transition()
            .duration(300)
            .style("fill", function (d) {
                if (d.depth < node.depth || d.depth == 0) {
                    return 'transparent';
                }
                return color(d);
            })
            .attrTween("d", arcTweenZoom(d))
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        if (d.name !== 'student' && d.name !== 'final' && typeof (d.children) != 'undefined' && typeof (temp.children) != 'undefined') {
            d3.select('#cate-score').text(Math.round(d.grade / d.max * 100) + '%');

            updateChart(0, d.name, 1200, 500, 40);
        }
        if (d.name == 'student' && temp.name != 'student') {
            updateChart(0, 'overall', 1200, 500, 40);
        }
        if (d.name == 'final') {
            d3.select('#cate').text('Final:');
            d3.select('#cate-score').text(Math.round(d.grade / d.max * 100) + '%');
        }
    }

    // Setup for switching data: stash the old values for transition.
    function stash(d) {
        d.x0 = d.x;
        d.dx0 = d.dx;
    }

    // When switching data: interpolate the arcs in data space.
    function arcTweenData(a, i) {
        var oi = d3.interpolate({
            x: a.x0,
            dx: a.dx0
        }, a);

        function tween(t) {
            var b = oi(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        }
        if (i == 0) {
            // If we are on the first arc, adjust the x domain to match the root node
            // at the current zoom level. (We only need to do this once.)
            var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
            return function (t) {
                x.domain(xd(t));
                return tween(t);
            };
        } else {
            return tween;
        }
    }

    // When zooming: interpolate the scales.
    function arcTweenZoom(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 120 : 0, radius]);
        return function (d, i) {
            return i ? function (t) {
                return arc(d);
            } : function (t) {

                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
                return arc(d);
            };
        };
    }

    function disableMouseTransition() {
        svg.selectAll("path").on("mouseover", null);
    }

    function mouseover(d) {
        var percentage = (100 * d.grade / d.max).toPrecision(3);
        var percentageString = percentage + "%";
        svg.select("#percentage")
            .text(percentageString);
        if (typeof d.children != 'undefined') {
            var gradeString = 'Overall score for all ' + d.name + 's';
        } else {
            var gradeString = 'Grade: ' + d.grade + '/' + d.max + ' Date: Day' + d.day;
        }
        svg.select("#grade")
            .text(gradeString);
        svg.select("#explanation")
            .style("visibility", "");
        var sequenceArray = getAncestors(d);
        // Fade all the segments.
        svg.selectAll("path")
            .style("opacity", 0.3);
        // Then highlight only those that are an ancestor of the current segment.
        svg.selectAll("path")
            .filter(function (node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style("opacity", 1);
    }

    function mouseleave(d) {
        // Deactivate all segments during transition.
        disableMouseTransition();
        // Transition each segment to full opacity and then reactivate it.
        svg.selectAll("path")
            .transition()
            .duration(500)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        d3.select("#explanation")
            .style("visibility", "hidden");
    }

    function mouseleaveinstant(d) {
        // Deactivate all segments during transition.
        disableMouseTransition();
        // Transition each segment to full opacity and then reactivate it.
        svg.selectAll("path")
            .transition()
            .duration(100)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        d3.select("#explanation")
            .style("visibility", "hidden");
    }

    function getAncestors(node) {
        var path = [];
        var current = node;
        while (current.parent) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }

    function getFormattedData(dataSet, stuIndex) {
        var stuData = dataSet[stuIndex];
        var resultData = {};
        resultData.name = 'student';
        resultData.children = []
        var homework = {};
        homework.name = 'homework';
        homework.children = [];
        for (i = 0; i < stuData.homework.length; i++) {
            var dailyHW = {};
            dailyHW.name = 'homework';
            dailyHW.day = stuData.homework[i].day;
            dailyHW.grade = stuData.homework[i].grade;
            dailyHW.size = 7.89;
            dailyHW.max = stuData.homework[i].max;
            homework.children.push(dailyHW);
        }
        homework.grade = homework.children.sum('grade');
        homework.max = homework.children.sum('max');
        resultData.children.push(homework);
        var final = {};
        final.name = 'final';
        final.children = [];
        for (i = 0; i < stuData.final.length; i++) {
            var dailyFinal = {};
            dailyFinal.name = 'final';
            dailyFinal.day = stuData.final[i].day;
            dailyFinal.grade = stuData.final[i].grade;
            dailyFinal.size = 120;
            dailyFinal.max = stuData.final[i].max;
            final.children.push(dailyFinal);
        }
        final.grade = final.children.sum('grade');
        final.max = final.children.sum('max');
        resultData.children.push(final);
        var quiz = {};
        quiz.name = 'quizes';
        quiz.children = [];
        for (i = 0; i < stuData.quizes.length; i++) {
            var dailyQuiz = {};
            dailyQuiz.name = 'quizes';
            dailyQuiz.day = stuData.quizes[i].day;
            dailyQuiz.grade = stuData.quizes[i].grade;
            dailyQuiz.size = 3.846;
            dailyQuiz.max = stuData.quizes[i].max;
            quiz.children.push(dailyQuiz);
        }
        quiz.grade = quiz.children.sum('grade');
        quiz.max = quiz.children.sum('max');
        resultData.children.push(quiz);

        var test = {};
        test.name = 'test';
        test.children = [];
        for (i = 0; i < stuData.test.length; i++) {
            var dailyTest = {};
            dailyTest.name = 'test';
            dailyTest.day = stuData.test[i].day;
            dailyTest.grade = stuData.test[i].grade;
            dailyTest.size = 70;
            dailyTest.max = stuData.test[i].max;
            test.children.push(dailyTest);
        }
        test.grade = test.children.sum('grade');
        test.max = test.children.sum('max');
        resultData.children.push(test);

        return resultData;
    }
}

function initializeSunburst(width, height) {
    //formatting data
    var root = getFormattedData(dataSet, 0);
    //keep track of current root
    var node = root;
    var radius = Math.min(width, height) / 2.4;

    // scales
    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    var y = d3.scale.pow().exponent(0.44)
        .range([0, radius]);
    var color = function (d) {
        if (d.name == 'homework') {
            if (typeof d.children != 'undefined') {
                return '#d51e4f';
            }
            return hwColor(d.grade);
        }
        if (d.name == 'test') {
            if (typeof d.children != 'undefined') {
                return '#ef6a81';
            }
            return testColor(d.grade);
        }
        if (d.name == 'quizes') {
            if (typeof d.children != 'undefined') {
                return '#d51e4f';
            }
            return quizColor(d.grade);
        }
        if (d.name == 'final') {
            if (typeof d.children != 'undefined') {
                return '#8a80e1';
            }
            return finalColor(d.grade);
        }
    }


    //initialize svg
    var svg = d3.select("#sunburst").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("id", "sunburstcontainer")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

    //initialize explantion bar
    var explanation = svg.append("g").attr('id', 'explanation').style('visibility', 'hidden');
    explanation.append('text').attr('id', 'percentage').attr('x', -73).attr('y', 10);
    explanation.append('text').attr('id', 'grade').attr('x', -73).attr('y', 31);

    //initialize partition
    var partition = d3.layout.partition()
        .sort(null)
        .value(function (d) {
            return 1;
        });

    //initialize arc function
    var arc = d3.svg.arc()
        .startAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        })
        .innerRadius(function (d) {
            return Math.max(0, y(d.y));
        })
        .outerRadius(function (d) {
            var gradeAmp = 0;
            return gradeAmp + Math.max(0, y(d.y + d.dy));
        });

    //draw the path graph
    var path = svg.datum(root).selectAll("path")
        .data(partition.value(function (d) {
            return d.size;
        }).nodes)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr('class', 'sunburst-path')
        .style("fill", function (d) {
            if (d.depth == 0) {
                // centre transparent
                return 'transparent';
            }
            return color(d);
        })
        .style("opacity", 1);
    //click for zoom
    svg.selectAll('.sunburst-path')
        .on("click", click)
        .on("mouseover", function (d) {
            if (d.depth == 0) {
                //centre as leaving area
                mouseleaveinstant(d);
            } else {
                //over for display data
                mouseover(d);
            }
        })
        .each(stash);

    //container as the leaving area
    d3.select("#sunburstcontainer").on("mouseleave", mouseleave);

    //click for zoom
    function click(d) {
        disableMouseTransition();
        var temp = node;
        node = d;
        svg.selectAll('.sunburst-path')
            .transition()
            .duration(300)
            .style("fill", function (d) {
                if (d.depth < node.depth || d.depth == 0) {
                    return 'transparent';
                }
                return color(d);
            })
            .attrTween("d", arcTweenZoom(d))
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        if (d.name !== 'student' && d.name !== 'final' && typeof (d.children) != 'undefined' && typeof (temp.children) != 'undefined') {
            d3.select('#cate-score').text(Math.round(d.grade / d.max * 100) + '%');

            updateChart(0, d.name, 1200, 500, 40);
        }
        if (d.name == 'student' && temp.name != 'student') {
            updateChart(0, 'overall', 1200, 500, 40);
        }
        if (d.name == 'final') {
            d3.select('#cate').text('Final:');
            d3.select('#cate-score').text(Math.round(d.grade / d.max * 100) + '%');
        }
    }

    // Setup for switching data: stash the old values for transition.
    function stash(d) {
        d.x0 = d.x;
        d.dx0 = d.dx;
    }

    // When switching data: interpolate the arcs in data space.
    function arcTweenData(a, i) {
        var oi = d3.interpolate({
            x: a.x0,
            dx: a.dx0
        }, a);

        function tween(t) {
            var b = oi(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        }
        if (i == 0) {
            // If we are on the first arc, adjust the x domain to match the root node
            // at the current zoom level. (We only need to do this once.)
            var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
            return function (t) {
                x.domain(xd(t));
                return tween(t);
            };
        } else {
            return tween;
        }
    }

    // When zooming: interpolate the scales.
    function arcTweenZoom(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 120 : 0, radius]);
        return function (d, i) {
            return i ? function (t) {
                return arc(d);
            } : function (t) {

                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
                return arc(d);
            };
        };
    }

    function disableMouseTransition() {
        svg.selectAll("path").on("mouseover", null);
    }

    function mouseover(d) {
        var percentage = (100 * d.grade / d.max).toPrecision(3);
        var percentageString = percentage + "%";
        svg.select("#percentage")
            .text(percentageString);
        if (typeof d.children != 'undefined') {
            var gradeString = 'Overall score for all ' + d.name + 's';
        } else {
            var gradeString = 'Grade: ' + d.grade + '/' + d.max + ' Date: Day' + d.day;
        }
        svg.select("#grade")
            .text(gradeString);
        svg.select("#explanation")
            .style("visibility", "");
        var sequenceArray = getAncestors(d);
        // Fade all the segments.
        svg.selectAll("path")
            .style("opacity", 0.3);
        // Then highlight only those that are an ancestor of the current segment.
        svg.selectAll("path")
            .filter(function (node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style("opacity", 1);
    }

    function mouseleave(d) {
        // Deactivate all segments during transition.
        disableMouseTransition();
        // Transition each segment to full opacity and then reactivate it.
        svg.selectAll("path")
            .transition()
            .duration(500)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        d3.select("#explanation")
            .style("visibility", "hidden");
    }

    function mouseleaveinstant(d) {
        // Deactivate all segments during transition.
        disableMouseTransition();
        // Transition each segment to full opacity and then reactivate it.
        svg.selectAll("path")
            .transition()
            .duration(100)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", function (d) {
                    if (d.depth == 0) {
                        mouseleaveinstant(d);
                    } else {
                        mouseover(d);
                    }
                });
            });
        d3.select("#explanation")
            .style("visibility", "hidden");
    }

    function getAncestors(node) {
        var path = [];
        var current = node;
        while (current.parent) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }

    function getFormattedData(dataSet, stuIndex) {
        var stuData = dataSet[stuIndex];
        var resultData = {};
        resultData.name = 'student';
        resultData.children = []
        var homework = {};
        homework.name = 'homework';
        homework.children = [];
        for (i = 0; i < stuData.homework.length; i++) {
            var dailyHW = {};
            dailyHW.name = 'homework';
            dailyHW.day = stuData.homework[i].day;
            dailyHW.grade = stuData.homework[i].grade;
            dailyHW.size = 7.89;
            dailyHW.max = stuData.homework[i].max;
            homework.children.push(dailyHW);
        }
        homework.grade = homework.children.sum('grade');
        homework.max = homework.children.sum('max');
        resultData.children.push(homework);
        var final = {};
        final.name = 'final';
        final.children = [];
        for (i = 0; i < stuData.final.length; i++) {
            var dailyFinal = {};
            dailyFinal.name = 'final';
            dailyFinal.day = stuData.final[i].day;
            dailyFinal.grade = stuData.final[i].grade;
            dailyFinal.size = 120;
            dailyFinal.max = stuData.final[i].max;
            final.children.push(dailyFinal);
        }
        final.grade = final.children.sum('grade');
        final.max = final.children.sum('max');
        resultData.children.push(final);
        var quiz = {};
        quiz.name = 'quizes';
        quiz.children = [];
        for (i = 0; i < stuData.quizes.length; i++) {
            var dailyQuiz = {};
            dailyQuiz.name = 'quizes';
            dailyQuiz.day = stuData.quizes[i].day;
            dailyQuiz.grade = stuData.quizes[i].grade;
            dailyQuiz.size = 3.846;
            dailyQuiz.max = stuData.quizes[i].max;
            quiz.children.push(dailyQuiz);
        }
        quiz.grade = quiz.children.sum('grade');
        quiz.max = quiz.children.sum('max');
        resultData.children.push(quiz);

        var test = {};
        test.name = 'test';
        test.children = [];
        for (i = 0; i < stuData.test.length; i++) {
            var dailyTest = {};
            dailyTest.name = 'test';
            dailyTest.day = stuData.test[i].day;
            dailyTest.grade = stuData.test[i].grade;
            dailyTest.size = 70;
            dailyTest.max = stuData.test[i].max;
            test.children.push(dailyTest);
        }
        test.grade = test.children.sum('grade');
        test.max = test.children.sum('max');
        resultData.children.push(test);

        return resultData;
    }
}

function getMultiOverArray() {
    var multiArray = [];
    for (i = 0; i < 41; i++) {
        var today = {};
        today.day = i + 1;
        for (j = 0; j < dataSet.length; j++) {
            today[j] = dataSet[j].overall[i].grade;
        }
        multiArray.push(today);
    }
    console.log(multiArray);
    return multiArray;
}

function initializeChart(width, height, name, padding) {
    //nitialize svg
    var svg = d3.select('#scchart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g');

    var xRange = 42
    var yRange = dataSet[0][name][0].max;

    //initialize xScale
    var xScale = d3.scale.linear()
        .domain([0, xRange])
        .range([0 + padding, width - padding]);

    //initialize yScale
    var yScale = d3.scale.linear()
        .domain([yRange, 0])
        .range([0 + padding, height - padding]);

    //draw axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10);

    svg.append('g')
        .attr('class', 'axis')
        .attr('id', 'xaxis')
        .attr('transform', 'translate(0,' + (height - padding) + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'axis')
        .attr('id', 'yaxis')
        .attr('transform', 'translate(' + padding + ', 0)')
        .call(yAxis);

    //initialize placeholder for circles
    /*svg.append('g')
        .attr('class', 'circles');*/

    //initialize placeholder for paths
    svg.append('g')
        .attr('class', 'lines')
        .append('path')
        .attr('id', 'line_self');

    svg.append('g')
        .append("path")
        .attr("id", "area");

    svg.select('.lines')
        .append('path')
        .attr('id', 'line_avg');

    var focus_self = svg.append("g")
        .attr("class", "focus_self")
        .style("display", "none");

    focus_self.append("circle")
        .attr("r", 8.5);



    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height);


    var focus_avg = svg.append("g")
        .attr("class", "focus_avg")
        .style("display", "none");

    focus_avg.append("circle")
        .attr("r", 5.5);

    svg.append("text")
        .attr('class', 'chart-score')
        .attr('id', 'avg-text')
        .attr('x', width * 0.8)
        .attr('y', 73);


    svg.append("text")
        .attr('class', 'chart-score')
        .attr('id', 'self-text')
        .attr('x', width * 0.8)
        .attr('y', 49);

    svg.append("text")
        .attr('class', 'chart-day')
        .attr('id', 'self-text')
        .attr('x', width * 0.64)
        .attr('y', 75);
}

function updateChart(stuIndex, name, width, height, padding) {
    d3.select('#overall-score').text(Math.round(dataSet[stuIndex].overall[40].grade) + '%');
    d3.select('#overall-rank').text('Class Average: 67% Rank:' + rankArray[stuIndex].rank);
    d3.select('#cate-rank').text('Class Average: 57% Rank:' + rankArray[stuIndex].rank);


    d3.select('#cate').text(capitalizeFirstLetter(name + ':'));
    if (name == 'overall') {
        d3.select('#cate-score').text(Math.round(dataSet[stuIndex].overall[40].grade) + '%');
    }
    var svg = d3.select('#scchart')
        .select('svg');

    var xRange = 42
    var yRange = dataSet[0][name][0].max;

    var xScale = d3.scale.linear()
        .domain([0, xRange])
        .range([0 + padding, width - padding]);

    var yScale = d3.scale.linear()
        .domain([yRange, 0])
        .range([0 + padding, height - padding]);

    //draw axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10);

    svg.select('#xaxis')
        .transition().duration(500)
        .call(xAxis);

    svg.select('#yaxis')
        .transition().duration(500)
        .call(yAxis);


    var bisectDate = d3.bisector(function (d) {
        return d.day;
    }).left

    var focus_self = svg.select('.focus_self');
    var focus_avg = svg.select('.focus_avg');


    svg.select(".overlay")
        .on("mouseover", function () {
            focus_self.style("display", null);
            focus_avg.style("display", null);
        })
        .on("mouseout", function () {
            focus_self.style("display", "none");
            focus_avg.style("display", "none");
        })
        .on("mousemove", mousemove);



    function mousemove() {
        data = dataSet[stuIndex][name];
        var x0 = xScale.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1);
        if (i >= data.length) {
            i -= 1;
        }
        var d0 = data[i - 1],
            d1 = data[i]
        var d = x0 - d0.day > d1.day - x0 ? d1 : d0;

        var d0_avg = avgArray[i - 1],
            d1_avg = avgArray[i]
        var d_avg = x0 - d0_avg.day > d1_avg.day - x0 ? d1_avg : d0_avg;
        focus_self.attr("transform", "translate(" + xScale(d.day) + "," + yScale(d.grade) + ")");
        svg.select("#self-text").text('Grade: ' + Math.round(d.grade));
        focus_avg.attr("transform", "translate(" + xScale(d_avg.day) + "," + yScale(d_avg.grade) + ")");
        svg.select("#avg-text").text('Avg: ' + Math.round(d_avg.grade));
        svg.select(".chart-day").text('Day' + d.day);

    }

    /*var circles = svg.select('.circles').selectAll('circle')
        .data(dataSet[stuIndex][name]);

    circles.enter()
        .append('circle')
        .transition()
        .duration(1000)
        .attr('cx', function (d) {
            return xScale(d.day);
        })
        .attr('cy', function (d) {
            return yScale(d.grade);
        })
        .attr('r', 3).style('fill', 'red');

    circles.transition()
        .duration(1000)
        .attr('cx', function (d) {
            return xScale(d.day);
        })
        .attr('cy', function (d) {
            return yScale(d.grade);
        })
        .attr('r', 3).style('fill', 'red');

    circles.exit()
        .remove();*/

    var line = d3.svg.line()
        .interpolate("cardinal")
        .x(function (d) {
            return xScale(d.day);
        })
        .y(function (d) {
            return yScale(d.grade);
        });

    var dict = prepareAvg();
    var avgArray = $.map(dict, function (value, index) {
        return [{
            'day': index,
            'grade': value
        }];
    });

    var lineAvg = d3.svg.line()
        .interpolate("cardinal")
        .x(function (d) {
            return xScale(d.day);
        })
        .y(function (d) {
            var avg = dict[d.day];
            return yScale(avg);
        });

    var area = d3.svg.area()
        .x(function (d) {
            return xScale(d.day);
        })
        .y0(height - padding)
        .y1(function (d) {
            var avg = dict[d.day];
            return yScale(avg);
        });

    function prepareAvg() {
        var dict = {};
        for (i = 0; i < dataSet[stuIndex][name].length; i++) {
            var total = 0;
            for (j = 0; j < dataSet.length; j++) {
                total += dataSet[j][name][i].grade;
            }
            dict[dataSet[stuIndex][name][i].day] = total / dataSet.length;
        }
        return dict;
    }


    function pathTween() {
        var interpolate = d3.scale.quantile()
            .domain([0, 1])
            .range(d3.range(1, 42));
        return function (t) {
            return line(dataSet[stuIndex][name].slice(0, interpolate(t)));
        };
    }

    function pathTweenAvg() {
        var interpolate = d3.scale.quantile()
            .domain([0, 1])
            .range(d3.range(1, 42));
        return function (t) {
            return line(avgArray.slice(0, interpolate(t)));
        };
    }

    svg.select('#line_self')
        .transition()
        .duration(2000)
        .attr('class', 'line')
        .attr('stroke-width', '7')
        .attr("d", line(dataSet[stuIndex][name]))
        .attrTween('d', pathTween);


    svg.select('#line_avg')
        .transition()
        .duration(2000)
        .attr('class', 'line')
        //.attr('display', 'none')
        .attr("d", lineAvg(dataSet[stuIndex][name]))
        .attrTween('d', pathTweenAvg);

    /*svg.select('#area')
        .transition()
        .duration(2000)
        .attr("d", area(dataSet[stuIndex][name]));*/
}

function prepareOverAll() {
    for (i = 0; i < dataSet.length; i++) {
        var data = dataSet[i];
        var dictOver = {};
        for (h = 0; h < data.homework.length; h++) {
            var piece = data.homework[h];
            if (dictOver[piece.day] !== undefined) {
                dictOver[piece.day].grade += piece.grade * 0.15 / 19;
                dictOver[piece.day].max += piece.max * 0.15 / 19;
            } else {
                dictOver[piece.day] = {};
                dictOver[piece.day].grade = piece.grade * 0.15 / 19;
                dictOver[piece.day].max = piece.max * 0.15 / 19;
            }
        }
        for (h = 0; h < data.quizes.length; h++) {
            var piece = data.quizes[h];
            if (dictOver[piece.day] !== undefined) {
                dictOver[piece.day].grade += piece.grade * 0.15 / 38;
                dictOver[piece.day].max += piece.max * 0.15 / 38;
            } else {
                dictOver[piece.day] = {};
                dictOver[piece.day].grade = piece.grade * 0.15 / 38;
                dictOver[piece.day].max = piece.max * 0.15 / 38;
            }
        }
        for (h = 0; h < data.test.length; h++) {
            var piece = data.test[h];
            if (dictOver[piece.day] !== undefined) {
                dictOver[piece.day].grade += piece.grade * 0.2;
                dictOver[piece.day].max += piece.max * 0.2;
            } else {
                dictOver[piece.day] = {};
                dictOver[piece.day].grade = piece.grade * 0.2;
                dictOver[piece.day].max = piece.max * 0.2;
            }
        }
        for (h = 0; h < data.final.length; h++) {
            var piece = data.final[h];
            if (dictOver[piece.day] !== undefined) {
                dictOver[piece.day].grade += piece.grade * 0.3;
                dictOver[piece.day].max += piece.max * 0.3;
            } else {
                dictOver[piece.day] = {};
                dictOver[piece.day].grade = piece.grade * 0.3;
                dictOver[piece.day].max = piece.max * 0.3;
            }
        }

        var overallArray = $.map(dictOver, function (value, index) {
            return [{
                'day': parseInt(index),
                'grade': value.grade,
                'max': value.max
        }];
        });
        data.overalldaily = overallArray;

        for (k = 1; k < overallArray.length; k++) {
            var current = overallArray[k];
            var previous = overallArray[k - 1];
            current.grade += previous.grade;
            current.max += previous.max;
        }

        for (k = 0; k < overallArray.length; k++) {
            var current = overallArray[k];
            current.grade = current.grade / current.max * 100;
            current.max = 100;
        }
        data.overall = overallArray;
    }
}

function renderStu(index) {
    initializeSunburst(560, 560);
    initializeChart(1200, 500, 'homework', 40);
    updateChart(index, 'overall', 1200, 500, 40);
}

function updateStu(index) {
    updateSunburst(index, 560, 560);
    updateChart(index, 'overall', 1200, 500, 40);
}

function getRankArray() {
    //index, rank, grade, pic
    var rankArray = [];
    for (i = 0; i < dataSet.length; i++) {
        var student = {};
        student.index = i;
        student.grade = dataSet[i].overall[40].grade;
        student.pic = dataSet[i].picture;
        rankArray.push(student);
    }

    function compare(a, b) {
        if (a.grade > b.grade)
            return -1;
        else if (a.grade < b.grade)
            return 1;
        else
            return 0;
    }

    function compareIndex(a, b) {
        if (a.index < b.index)
            return -1;
        else if (a.index > b.index)
            return 1;
        else
            return 0;
    }
    rankArray.sort(compare);
    for (i = 0; i < rankArray.length; i++) {
        rankArray[i].rank = i + 1;
    }
    rankArray.sort(compareIndex);
    return rankArray;
}
var dataSet;
var rankArray;
var multiArray;
var pieData;
d3.json("classData.json", function (error, data) {
    dataSet = data;
    prepareOverAll();
    rankArray = getRankArray();
    multiArray = getMultiOverArray();
    pieData = getPieData();
    console.log(dataSet);
    renderStu(11);
    drawBarChart();
    drawMulti(1300, 600, 40);
    drawPie();
});

function vanish(name) {
    $(name).fadeOut(800, 'swing');
}

function grow(name) {
    $(name).fadeIn(1000, 'swing');

}


function getPieData() {
    var pieData = [];
    for (j = 1; j < 42; j++) {
        pieData.push({
            day: j,
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            f: 0
        })
    }
    for (i = 0; i < dataSet.length; i++) {
        var overalldaily = dataSet[i].overalldaily;
        for (k = 0; k < 41; k++) {
            var grade = overalldaily[k].grade;
            if (grade > 90) {
                pieData[k].a += 1;
            } else if (grade > 80) {
                pieData[k].b += 1;

            } else if (grade > 70) {
                pieData[k].c += 1;

            } else if (grade > 60) {
                pieData[k].d += 1;

            } else {
                pieData[k].f += 1;

            }
        }
    }
    console.log(pieData);
    return pieData;
}


//////////


function drawPie() {
    var radius = 74,
        padding = 10;

    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - 30);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return d.population;
        });

    data = pieData;
    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "day";
    }));

    data.forEach(function (d) {
        d.grades = color.domain().map(function (name) {
            return {
                name: name,
                population: +d[name]
            };
        });
    });

    var legend = d3.select("#donuts-chart").append("svg")
        .attr("class", "legend")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .selectAll("g")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function (d) {
            return d;
        });

    var svg = d3.select("#donuts-chart")
        .selectAll(".pie")
        .data(data)
        .enter().append("svg")
        .attr("class", "pie")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    svg.selectAll(".arc")
        .data(function (d) {
            return pie(d.grades);
        })
        .enter().append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .style("fill", function (d) {
            return color(d.data.name);
        });

    svg.append("text")
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function (d) {

            return 'Day' + d.day;
        });


}



function drawBarChart() {
    var data = rankArray;
    console.log(data);
    var margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        width = 1400 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var formatPercent = function (d) {
        return d + '%';
    };

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1, 1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(formatPercent);

    var svg = d3.select("#bar-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");




    x.domain(data.map(function (d) {
        return d.index;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.grade;
    })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    /*svg.append("g")
    .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Overall Grade"); */

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr('id', function (d) {
            return 'rect' + d.index;
        })
        .attr("x", function (d) {
            return x(d.index);
        })
        .attr("width", x.rangeBand())
        .attr("y", function (d) {
            return y(d.grade);
        })
        .attr("height", function (d) {
            return height - y(d.grade);
        })
        .on('click', function (d) {
            console.log('clicked');
            updateStu(d.index);
            vanish('.main-page');
            vanish('.stats-page');
            grow('.student-page');

        })
        .on("mouseover", function (d) {
            console.log(d.index);
            d3.select('#line' + d.index).style("stroke", "ffcc00").style('stroke-width', 6);
            d3.select(this).style("fill", "ffcc00");
            d3.select('#main-rank').text(d.rank);
            d3.select('#main-grade').text(Math.round(d.grade));
            d3.select('#main-name').text(d.index);

        })
        .on("mouseleave", function (d) {
            d3.select(this).style("fill", "black");
            d3.select('#line' + d.index).style("stroke", "black").style('stroke-width', 1);

        });


    d3.select("#change").on("change", change);

    var sortTimeout = setTimeout(function () {
        d3.select("input").property("checked", true).each(change);
    }, 2000);
    change();

    function change() {
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = x.domain(data.sort(this.checked ? function (a, b) {
                    return b.grade - a.grade;
                } : function (a, b) {
                    return d3.ascending(a.index, b.index);
                })
                .map(function (d) {
                    return d.index;
                }))
            .copy();

        svg.selectAll(".bar")
            .sort(function (a, b) {
                return x0(a.index) - x0(b.index);
            });

        var transition = svg.transition().duration(750),
            delay = function (d, i) {
                return i * 50;
            };

        transition.selectAll(".bar")
            .delay(delay)
            .attr("x", function (d) {
                return x0(d.index);
            });

        transition.select(".x.axis")
            .call(xAxis)
            .selectAll("g")
            .delay(delay);
    }
}

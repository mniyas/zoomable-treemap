function treemap(selector) {
    // set the dimensions and margins of the graph
    var margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 0
        },
        width = 960 - margin.left - margin.right,
        height = 850 - margin.top - margin.bottom;
    x = d3.scaleLinear().range([0, width]);
    y = d3.scaleLinear().range([0, height]);
    var svg = d3.select(selector).append("svg")
        .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr("width", '100%')
        .attr("height", '100%')
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var fader = function(color) {
            return d3.interpolateRgb(color, "#fff")(0.2);
        },
        color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
        format = d3.format(",d");

    var treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width, height])
        .round(true)
        .paddingInner(1);

    d3.json("flare.json", function(error, data) {
        if (error) throw error;

        var root = d3.hierarchy(data)
            .eachBefore(function(d) {
                d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
            })
            .sum(d => d.size)
            .sort(function(a, b) {
                return b.height - a.height || b.value - a.value;
            });

        node = root;
        treemap(root);

        var cell = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            })
            .on("click", function(d) {
                return zoom(node == d.parent ? root : d.parent);
            });

        cell.append("rect")
            .attr("id", function(d) {
                return d.data.id;
            })
            .attr("width", function(d) {
                return d.x1 - d.x0;
            })
            .attr("height", function(d) {
                return d.y1 - d.y0;
            })
            .attr("fill", function(d) {
                return color(d.parent.data.id);
            });

        cell.append("svg:text")
            .attr("x", function(d) {
                return (d.x1 - d.x0) * 0.5;
            })
            .attr("y", function(d) {
                return (d.y1 - d.y0) * 0.5;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.data.name;
            })
            .style("opacity", function(d) {
                d.w = this.getComputedTextLength();
                return (d.x1 - d.x0) > d.w ? 1 : 0;
            });

    });

    function zoom(d) {
        var _w = d.x1 - d.x0,
            _h = d.y1 - d.y0;
        var kx = width * 1.0 / _w,
            ky = height * 1.0 / _h;
        x.domain([d.x0, d.x0 + _w]);
        y.domain([d.y0, d.y0 + _h]);

        var t = svg.selectAll("g.cell").transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function(d) {
                return "translate(" + x(d.x0) + "," + y(d.y0) + ")";
            });

        t.select("rect")
            .attr("width", function(d) {
                return kx * (d.x1 - d.x0) - 1;
            })
            .attr("height", function(d) {
                return ky * (d.y1 - d.y0) - 1;
            })

        t.select("text")
            .attr("x", function(d) {
                return kx * (d.x1 - d.x0) / 2;
            })
            .attr("y", function(d) {
                return ky * (d.y1 - d.y0) / 2;
            })
            .style("opacity", function(d) {
                return kx * (d.x1 - d.x0) > d.w ? 1 : 0;
            });

        node = d;
        d3.event.stopPropagation();
    }

}
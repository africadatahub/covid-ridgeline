import React from 'react';

import _ from 'lodash';
import * as d3 from 'd3';
import * as Color from 'color';

export class JoyChart extends React.Component {
    
    constructor(){
        super();
        this.state = {
            colors: [
                { region: 'Northern Africa', color: '#fb8500' },
                { region: 'Central Africa', color: '#ffb703' },
                { region: 'Western Africa', color: '#023047' },
                { region: 'Eastern Africa', color: '#219ebc' },
                { region: 'Southern Africa', color: '#8ecae6' }
            ],
            settings: {
                height: 800,
                width: undefined,
                margin: {
                    top: 100, 
                    right: 70, 
                    bottom: 30, 
                    left: 100
                },
                overlap: 6
            },
            container: null
        }
    }

    componentDidMount() {

        console.log('JoyChart::mounting');

        setTimeout(() => {
            var settings = {...this.state.settings}
            settings.width = d3.select('.container').node().getBoundingClientRect().width;
            this.setState({
                settings,
                container: d3.select('#JoyChart').attr('height', this.state.settings.height).attr('width', this.state.settings.width),
            }, () => this.showData())
        }, 1000)

    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        if(this.props.countries.length != prevProps.countries.length ||
            this.props.data.length != prevProps.data.length ||
            this.props.dates.length != prevProps.dates.length ||
            this.props.selectedMetric != prevProps.selectedMetric) {
            return true;
        } else {
            return null;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot == true) {
            console.log('JoyChart::componentDidUpdate');
            this.showData();
        }
    }

    

    getColor = (d,i) => {
        let region_step = _.filter(this.props.countries, o => o.region == d.region).length;
        return Color(this.state.colors.find((color) => color.region === d.region).color).lighten((10/region_step*d.regionOrder)/100);
    }

    

    showData = () => {

        let self = this;

        let data = {
            dates: this.props.dates.map(d => new Date(d)),
            series: this.props.data
        };

        let x = d3.scaleTime()
            .domain(d3.extent(data.dates))
            .range([this.state.settings.margin.left, this.state.settings.width - this.state.settings.margin.right]);

        let y = d3.scalePoint()
            .domain(data.series)
            .range([this.state.settings.margin.top, this.state.settings.height - this.state.settings.margin.bottom]);

        let z = d3.scaleLinear()
            .domain([0, d3.max(data.series, d => d3.max(d.values.map((dd) => dd[self.props.selectedMetric])))]).nice()
            .range([0, -this.state.settings.overlap * 4]);

        let yAxis = g => g
            .attr('id','countries')
            .attr("transform", `translate(${this.state.settings.margin.left},-4)`)
            .call(d3.axisLeft(y)
            .tickSize(0)
            .tickPadding(4)
                .tickFormat(d => { 
                    let location = this.props.countries.filter(country => { return country.iso_code === d.iso_code })[0].location;
                    return location.length > 5 ? location.substring(0,10) + '...' : location + '...';
                }))
            .call(g => g.select(".domain").remove());

        let xAxis = g => g
            .attr('id','xAxis')
            .attr("transform", `translate(0,${this.state.settings.height - this.state.settings.margin.bottom + 5})`)
            .call(d3.axisBottom(x)
                .ticks(this.state.settings.width / 90)
                .tickFormat(d => {
                    return new Date(d).toLocaleDateString(
                        'en-gb',
                        {
                            month: 'numeric',
                            day: 'numeric'
                        }
                    )
                })
                .tickSizeOuter(0))
            .call(g => g.select(".domain").attr('stroke','#999'));

       

        let area = d3.area()
            .curve(d3.curveBasis)
            .x((d,i) => {
                return x(data.dates[i])
            })
            .y0(0)
            .y1((d,i) => { 
                return z(d[self.props.selectedMetric] == null ? 0 : d[self.props.selectedMetric]);
            });


        if(d3.select('#xAxis').empty()) {
            this.state.container.append("g")
                .call(xAxis);
        } else {
            d3.select('#xAxis').call(xAxis);
        }

        if(d3.select('#countries').empty()) {
            this.state.container.append("g")
                .call(yAxis);
        } else {
            d3.select('#countries').call(yAxis);
        }

        if(d3.select('#chart').empty()) {
            this.state.container.append("g")
                .attr('id','chart');
        }

        const group = d3.select('#chart')
            .selectAll("g")
            .data(data.series);

        group.enter()
            .append("g")
                .attr("id", d => d.iso_code)
                .attr("transform", d => {
                    return `translate(0,${y(d) + 1})`
                });
        
        group.exit()
            .remove();

        const countries = d3.selectAll('#chart g')
            
        countries.each((country, index) => {
            
            if(d3.select('#' + country.iso_code + ' path').empty()) {
                d3.select('#' + country.iso_code)
                    .append('path')
                    .attr("fill", (d,i) => {
                        return this.getColor(d,i);
                    })
                    .style("opacity", "0.6")
            }

            d3.select('#' + country.iso_code + ' path')
                .attr("d", () => {
                    return area(country.values)
                })
        })

        console.log(countries);
        

            //     .select('path')
            //     .attr("d", d => { 
            //         return area(d.values)
            //     })
            //     .append("path")
            //         .attr("fill", (d,i) => {
            //                 return this.getColor(d,i);
            //             })
            //         .attr("d", d => { 
            //             return area(d.values)
            //         })
            //         .style("opacity", "0.6")
            // .merge(group)
                

        
            // .merge(group)
        
      

       
        
       

        // group.selectAll('g')
        //     .append("path")
        //     .attr("fill", (d,i) => {
        //             return this.getColor(d,i);
        //         })
        //     .attr("d", d => { 
        //         return area(d.values)
        //     })
        //     .style("opacity", "0.6");

        // group.enter()
        //     .append('text')
        //     .attr('class','value')
        //     .attr('fill','#000')
        //     .attr('x', this.state.settings.margin.left)
        //     .attr('y',0)
        //     .attr('width',100)
        //     .attr('height',15)
        //     .style('font-size','10px');

       
            

        

      

        // MOUSEOVER STUFF

        // var mouseG = this.state.container.append("g")
        //     .attr("class", "mouse-over-effects");

        // mouseG.append('rect')
        //     .attr('class', 'click-capture')
        //     .style('fill', 'transparent')
        //     .attr('x', this.state.settings.margin.left)
        //     .attr('y', 0)
        //     .attr('width', this.state.settings.width - this.state.settings.margin.right - this.state.settings.margin.left)
        //     .attr('height', this.state.settings.height);

        // mouseG.append("path")
        //     .attr("class", "mouse-line")
        //     .style("stroke", "#333")
        //     .style("stroke-width", "1px")
        //     .style("opacity", "1")

        // var dateTag = mouseG.append('g')
        //     .attr('class','date-tag')

        // dateTag.append('rect')
        //     .attr('class','current-date-bg')
        //     .attr('fill', '#333')
        //     .attr('y', 9)

        // dateTag.append('text')
        //     .attr('class','current-date')
        //     .text('-')
        //     .attr('y', 20)
        //     .attr('fill','#fff')
        //     .style('font-size','10px')

        this.mouseOver(x);

       

    }

    mouseOver = (x) => {

        let self = this;

        let yTicks = d3.select('#countries').selectAll('.tick');

        yTicks.nodes().forEach((dd) => {
            var data = d3.select(dd).data();

            d3.select(dd)
                .style('color', this.state.colors.find((color) => color.region === data[0].region).color)
                .on("mouseover", (d) => {
                    d3.select(dd).style('cursor','pointer').style('color','red');
                    d3.select('#' + data[0].iso_code + ' text:last-child').attr('fill','red');
                    d3.select('#' + data[0].iso_code + ' path').style("opacity", "0.9");
                })                  
                .on("mouseout", (d,i) => {
                    d3.select(dd).style('color', this.state.colors.find((color) => color.region === data[0].region).color);
                    d3.select('#' + data[0].iso_code + ' text:last-child').attr('fill','#000');    
                    d3.select('#' + data[0].iso_code + ' path').style("opacity", "0.6");
                });
        })

        // const bisectDate = d3.bisector(d=>d.date).right;
        
        // d3.select('.click-capture').on('mousemove', (e) => { 
        //     var mouse = d3.pointer(e, this.state.container.node());

        //     d3.selectAll('.value')
        //         .attr('fill','#000')
        //         .text((d) => {
        //             let checkDate = x.invert(mouse[0]).toISOString().split('T')[0];
        //             let seriesDate = _.find(d.values, (o) => { return o.date.split('T')[0] == checkDate })
        //             let value = seriesDate[self.props.selectedMetric]
        //             return (seriesDate != undefined && value != undefined) ? Math.round(value) : '-';        
        //         })

        //     d3.selectAll('.total-value')
        //         .attr('fill','#000')
        //         .text((d) => {
        //             return d.total_cases  
        //         })
            
        //     d3.select('.current-date-bg')
        //         .attr('x', () => {
        //             let canvasWidth = this.state.settings.width - this.state.settings.margin.right - this.state.settings.margin.left;
        //             if(mouse[0] > this.state.settings.margin.left + (canvasWidth/2)) {
        //                 return mouse[0] - (d3.select('.current-date').node().getBoundingClientRect().width + 10);
        //             } else {
        //                 return mouse[0];
        //             }
        //         })
        //         // .attr('y', mouse[1] - 11)
        //         .attr('width', d3.select('.current-date').node().getBoundingClientRect().width + 10)
        //         .attr('height',  d3.select('.current-date').node().getBoundingClientRect().height + 3)

        //     d3.select('.current-date') 
        //         .attr('x', () => {
        //             let canvasWidth = this.state.settings.width - this.state.settings.margin.right - this.state.settings.margin.left;
        //             if(mouse[0] > this.state.settings.margin.left + (canvasWidth/2)) {
        //                 return mouse[0] - d3.select('.current-date').node().getBoundingClientRect().width - 5;
        //             } else {
        //                 return mouse[0] + 5;
        //             }
        //         })                
        //         // .attr('y', mouse[1])
        //         .text((d) => {
        //             let checkDate = new Date(x.invert(mouse[0])).toISOString().split('T')[0];
        //             return checkDate;
        //         })

        //     d3.select(".mouse-line")
        //         .attr("d", () => {
        //             var d = "M" + mouse[0] + "," + this.state.settings.height;
        //             d += " " + mouse[0] + "," + 0;
        //             return d;
        //         })
                
        // })
        // .on('mouseout', () => {
        //     d3.select(".mouse-line")
            
        // })
    }

    // updateData = () => {
        
        // let self = this;

        // let data = {
        //     dates: this.props.dates.map(d => new Date(d)),
        //     series: this.props.data
        // };

        // let x = d3.scaleTime()
        //     .domain(d3.extent(data.dates))
        //     .range([this.state.settings.margin.left, this.state.settings.width - this.state.settings.margin.right]);

        // let y = d3.scalePoint()
        //     .domain(data.series)
        //     .range([this.state.settings.margin.top, this.state.settings.height - this.state.settings.margin.bottom]);

        // let z = d3.scaleLinear()
        //     .domain([0, d3.max(data.series, d => d3.max(d.values.map((dd) => dd[self.props.selectedMetric])))]).nice()
        //     .range([0, -this.state.settings.overlap * 4]);

        // let yAxis = g => g
        //     .attr('id','countries')
        //     .attr("transform", `translate(${this.state.settings.margin.left},-4)`)
        //     .call(d3.axisLeft(y)
        //     .tickSize(0)
        //     .tickPadding(4)
        //         .tickFormat(d => { 
        //             let location = this.props.countries.filter(country => { return country.iso_code === d.iso_code })[0].location;
        //             return location.length > 5 ? location.substring(0,10) + '...' : location + '...';
        //         }))
        //     .call(g => g.select(".domain").remove());

        // let xAxis = g => g
        //     .attr('id','xAxis')
        //     .attr("transform", `translate(0,${this.state.settings.height - this.state.settings.margin.bottom + 5})`)
        //     .call(d3.axisBottom(x)
        //         .ticks(this.state.settings.width / 90)
        //         .tickFormat(d => {
        //             return new Date(d).toLocaleDateString(
        //                 'en-gb',
        //                 {
        //                     month: 'numeric',
        //                     day: 'numeric'
        //                 }
        //             )
        //         })
        //         .tickSizeOuter(0))
        //     .call(g => g.select(".domain").attr('stroke','#999'));


        // this.setState({
        //     x: x,
        //     y: y,
        //     z: z,
        //     xAxis: xAxis,
        //     yAxis: yAxis
        // }, () => {
        //     d3.select('#xAxis').call(xAxis);
        //     d3.select('#countries').call(yAxis);

        //     let area = d3.area()
        //         .curve(d3.curveBasis)
        //         .x((d,i) => {
        //             return x(data.dates[i])
        //         })
        //         .y0(0)
        //         .y1((d,i) => { 
        //             return z(d[self.props.selectedMetric] == null ? 0 : d[self.props.selectedMetric]);
        //         });

        //     const group = d3.select('#chart')
        //         .selectAll("g")
        //         .data(data.series)
        //         .attr("transform", d => {
        //             return `translate(0,${y(d) + 1})`
        //         })
        //         .join('g')
        //         .selectAll('path')
        //         .attr("d", d => { 
        //             return area(d.values)
        //         });


        //     group.exit()
        //         .transition()
        //         .remove()

                
        //     group.enter()
        //         .append('g')
        //         .attr("id", d => d.iso_code)
        //         .attr("transform", d => {
        //             return `translate(0,${y(d) + 1})`
        //         })
        //         .append("path")
        //         .attr("fill", (d,i) => {
        //                 return this.getColor(d,i);
        //             })
        //         .attr("d", d => { 
        //             return area(d.values)
        //         })
        //         .style("opacity", "0.6");
                
          
         

          
               

            // this.mouseOver();

        // });

        

        
        
    // }

    render() {
        return <svg id="JoyChart"></svg>
    }

}

import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import axios from 'axios';
import {csv} from 'd3-fetch';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
// import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
// import Modal from 'react-bootstrap/Modal';

// import Nouislider from "nouislider-react";
// import "nouislider/distribute/nouislider.css";

import moment from 'moment';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCalendarDay, faGrinTongueSquint } from '@fortawesome/free-solid-svg-icons';

import 'react-dates/initialize';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';

import { CheckBoxSelection, Inject, MultiSelectComponent } from '@syncfusion/ej2-react-dropdowns';

import { JoyChart } from './components/JoyChart';

import './app.scss';
// import { select } from 'd3';


export class App extends React.Component {
    
    constructor(){
        super();
        this.state = {
            api: {
                baseUrl: 'https://adhtest.opencitieslab.org/api/3/',
                countryData: 'b2b6b48a-3685-4e1a-8d8c-8aab5bae3118' 
            },

            loading: true,
            loadingText: 'Loading...',

            dates: [],
            date_range: [],
            startDate: null,
            endDate: null,
            minDate: null,
            maxDate: null,

            focusedInput: null,
            focused: false,

            regions: [],
            countries: [],
            selectedCountries: [],
            CheckBoxSelection: [],

            selectedMetric: 'new_cases_smoothed',

            data: []
        }
    }

    componentDidMount() {

        this.setState({ loadingText: 'Loading African regions list...' });

        Promise.all([
            csv("./regions.csv"),
        ]).then((files) => {

            // REGIONS
            // Load the regions CSV and populate the countries dropdown

            let regions = files[0];

            let regionsList = regions.map((region) => {
                return region.region;
            })

            let uniqIds1 = {}, source1 = regionsList;
            regionsList = source1.filter(obj => !uniqIds1[obj] && (uniqIds1[obj] = true));

            let countries = [];

            // Here we order the regions so that North is on top and South at the bottom.

            // We're also adding country counts so that we know how many is in a region and can shade the fills accordingly.

            let region_order = [
                { 
                    region: 'Northern Africa',
                    count: 0 
                }, 
                { 
                    region: 'Eastern Africa',
                    count: 0 
                },
                { 
                    region: 'Central Africa',
                    count: 0 
                },
                { 
                    region: 'Western Africa',
                    count: 0 
                },
                { 
                    region: 'Southern Africa',
                    count: 0 
                }
            ]

            for (let index = 0; index < regions.length; index++) {

                let order = _.findIndex(region_order, region => regions[index].region == region.region);

                region_order[order].count = region_order[order].count + 1;

                countries.push({
                    iso_code: regions[index].iso_code,
                    location: regions[index].country,
                    region: regions[index].region,
                    value: regions[index].iso_code,
                    label: regions[index].country,
                    order: order,
                    regionOrder: region_order[order].count
                })

            }

            countries = _.sortBy(countries, 'order');

            this.setState({ loadingText: 'Calculating pandemic dates...' });
            
            // ALL DATES
            // Get all the dates in the complete dataset

            axios.get(this.state.api.baseUrl + 'action/datastore_search_sql?sql=SELECT%20DISTINCT%20date%20FROM%20"' + this.state.api.countryData + '"%20ORDER%20BY%20date%20ASC',
                { headers: {
                    authorization: process.env.REACT_API_KEY
                }
            })
            .then((response) => {

                let dates = [];
                
                for (let index = 0; index < response.data.result.records.length; index++) {
                    dates.push(response.data.result.records[index].date)
                }

                // Save the dates for the entire pandemic: dates, startDate, endDate, minDate and maxDate

                this.setState({
                    regions: regionsList,
                    countries: countries,
                    selectedCountries: countries.map((country) => country.iso_code),

                    dates: dates,
                    dateRange: dates,
                    startDate: dates[0],
                    endDate: dates[dates.length - 1],
                    minDate: dates[0],
                    maxDate: dates[dates.length - 1]
                }, () => this.executeQuery())

            })
        
        })


    }


    executeQuery = () => {

        this.setState({ loadingText: 'Fetching countries data...' });

        // QUERY
        // Execute the main query based on selections

        axios.get(this.state.api.baseUrl + 'action/datastore_search_sql?sql=SELECT%20iso_code%2Cdate%2Ctotal_cases%2Ctotal_deaths%2C' + this.state.selectedMetric + '%20FROM%20"' + this.state.api.countryData + '"%20WHERE%20date%20BETWEEN%20%27' + moment(this.state.startDate).format('YYYY-MM-DD') + '%27%20AND%20%27' + moment(this.state.endDate).format('YYYY-MM-DD') + '%27%20AND%20iso_code%20IN%20%28%27' + _.join(this.state.selectedCountries, '%27%2C%27') + '%27%29',
        { headers: {
            authorization: process.env.REACT_API_KEY
        }
        }).then((response) => {
            
            // Set up an array with all the countries

            let selectedCountries = [];

            this.state.selectedCountries.forEach((iso_code) => {
                selectedCountries.push(_.find(this.state.countries, (country) => country.iso_code == iso_code));
            })

            let finalCountriesData = selectedCountries;


            // Add an empty values array where we will story each day's data.

            finalCountriesData.forEach((country) => {
                country.values = [];
            })

            this.setState({ loadingText: 'Grouping countries...' });

            // loop through the incoming records and add it to the related country's new values array.
            
                response.data.result.records.forEach((data) => {

                    let iso_code = data.iso_code;

                    let related_country_index = _.findIndex(finalCountriesData, o => { 
                        return o.iso_code == iso_code
                    });
                    
                    finalCountriesData[related_country_index].values.push(data);

                })

                let start_date_index = _.findIndex(this.state.dates, d => d == this.state.startDate);
                let end_date_index = _.findIndex(this.state.dates, d => d == this.state.endDate);

                // Loop through each country and fill in missing days. And also sort it.

                this.setState({ loadingText: 'Filling in missing dates...' });

                finalCountriesData.forEach((country) => {

                    let sortedFilledArray = [];

                    for (let index = start_date_index; index < end_date_index; index++) {
                        
                        if(_.find(country.values, o => o.date == this.state.dates[index]) == undefined) {

                            country.values.push({
                                iso_code: country.iso_code,
                                date: this.state.dates[index],
                                total_cases: '0',
                                total_deaths: '0',
                                [this.state.selectedMetric]: '0'
                            })
                        }
                        
                    }

                    sortedFilledArray = _.sortBy(country.values, (o) => { return o.date; } );
                    country.values = sortedFilledArray;

                    
                })

                /* Final data looks like: [
                    {
                        iso_code: 'ZAF',
                        location: 'South Africa',
                        region: 'Southern Africa',
                        order: 0,
                        values: [
                            {
                                date: '2020-02-07',
                                new_cases: 20,
                                total_cases: 20
                            }
                        ]
                    }
                ] */

                this.setState({ loadingText: 'Drawing moutain ranges...' });


                this.setState({
                    data: finalCountriesData,
                    loading: false,
                    loadingText: ''
                }) 
            
        
        })
             
    }
    

    filterByCountry = (e) => {

        let selectedCountries = e.value;

        this.setState({
                loading: true,
                selectedCountries: selectedCountries,
            }, () => this.executeQuery()
        );
    }

    selectDates = ({ startDate, endDate }) => {

        let date_range = _.filter(this.state.dates, (d) => { return moment(d) >= moment(startDate) && moment(d) <= moment(endDate) });
        
        this.setState({
                loading: true,
                dateRange: date_range,
                startDate: date_range[0],
                endDate: date_range[date_range.length-1]
            }, () => this.executeQuery()
        );
 
    }

    selectMetric = (e) => {
        this.setState({
                loading: true,
                selectedMetric: e.target.value
            }, () => this.executeQuery()
        );
    }
    
    render() {
        return <> 
            { this.state.loading ? 
                <>
                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                        <Spinner animation="grow" />
                        <p className="mt-4">{ this.state.loadingText }</p>
                        <Container></Container>
                    </div>
                </> :
                <>
                    <header>
                        <Container className="py-4">
                            <Row>
                                <Col>
                                    <MultiSelectComponent 
                                        id="mtselement"
                                        popupHeight='600px'
                                        fields={{ groupBy: 'region', text: 'label', value: 'value' }}
                                        dataSource={this.state.countries}
                                        value={this.state.selectedCountries}
                                        placeholder="Select Countries"
                                        mode="CheckBox"
                                        enableGroupCheckBox="true"
                                        allowFiltering="true"
                                        showSelectAll="true"
                                        filterBarPlaceholder="Search Countries"
                                        change={this.filterByCountry}>
                                            <Inject services={[CheckBoxSelection]} />
                                    </MultiSelectComponent>
                                </Col>
                                <Col>
                                    <Form.Select className="control-grey" onChange={this.selectMetric} value={this.state.selectedMetric}>
                                        <option value="new_cases_smoothed">New Cases Smoothed</option>
                                        <option value="new_cases_smoothed_per_million">New Cases Smoothed Per Million</option>
                                        <option value="new_deaths">New Deaths</option>
                                    </Form.Select>
                                </Col>
                                <Col>
                                    { (this.state.startDate != null && this.state.endDate != null) ?
                                    <DateRangePicker
                                        startDate={moment(this.state.startDate)} 
                                        startDateId="startDate" 
                                        endDate={moment(this.state.endDate)} 
                                        endDateId="endDate" 
                                        onDatesChange={this.selectDates} 
                                        focusedInput={this.state.focusedInput} 
                                        onFocusChange={focusedInput => this.setState({ focusedInput })} 
                                        startDatePlaceholderText='START'
                                        endDatePlaceholderText='END'
                                        small={true}
                                        isOutsideRange={() => false}
                                        displayFormat='DD/MM/YYYY'
                                    /> : '' }
                                </Col>
                            </Row>
                        </Container>
                    </header>
                    <Container className="mt-4">
                        { !this.state.loading ?
                            <Card className="mt-4">
                                <JoyChart 
                                    data={ this.state.data }
                                    countries={ this.state.countries }
                                    dates={ this.state.dateRange }
                                    selectedMetric= { this.state.selectedMetric }
                                />
                            </Card>
                            : '' 
                        }
                    </Container>
                </>
            }
        </>
    }

}

const container = document.getElementsByClassName('app')[0];
ReactDOM.render(React.createElement(App), container);
import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import _ from 'lodash';
import axios from 'axios';
import {csv} from 'd3-fetch';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Spinner from 'react-bootstrap/Spinner';

import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';

import Nouislider from "nouislider-react";
import "nouislider/dist/nouislider.css";

import moment from 'moment';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCalendarDay, faGrinTongueSquint } from '@fortawesome/free-solid-svg-icons';

import { CheckBoxSelection, Inject, MultiSelectComponent } from '@syncfusion/ej2-react-dropdowns';

import { JoyChart } from './components/JoyChart';

import './app.scss';
import { select } from 'd3';


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
            dateRange: [],
            startDate: null,
            endDate: null,

            regions: [],
            countries: [],
            selectedCountries: [],
            countriesSelectBox: [],

            selectedMetric: 'new_cases_smoothed',

            data: [],
            currentData: []
        }
    }

    componentDidMount() {

        console.log('Loading African regions list...');
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

            let countriesSelectBox = countries;

            countriesSelectBox = _.orderBy(countriesSelectBox, 'order');

            let region_countries = _.filter(countries, (country) => country.region == 'Northern Africa');

            countriesSelectBox.splice(0, 0, {
                iso_code: region_countries.map(country => country.iso_code),
                location: 'Northern Africa'
            })

            region_countries = _.filter(countries, (country) => country.region == 'Eastern Africa');

            countriesSelectBox.splice(7, 0, {
                iso_code: region_countries.map(country => country.iso_code),
                location: 'Eastern Africa'
            })

            region_countries = _.filter(countries, (country) => country.region == 'Central Africa');

            countriesSelectBox.splice(26, 0, {
                iso_code: region_countries.map(country => country.iso_code),
                location: 'Central Africa'
            })

            region_countries = _.filter(countries, (country) => country.region == 'Western Africa');

            countriesSelectBox.splice(36, 0, {
                iso_code: region_countries.map(country => country.iso_code),
                location: 'Western Africa'
            })

            region_countries = _.filter(countries, (country) => country.region == 'Southern Africa');

            countriesSelectBox.splice(54, 0, {
                iso_code: region_countries.map(country => country.iso_code),
                location: 'Southern Africa'
            })

            

            console.log('Calculating pandemic dates...');
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
                    countriesSelectBox: countriesSelectBox,
                    dates: dates,
                    dateRange: dates,
                    startDate: 0,
                    endDate: dates.length - 1
                }, () => this.fetchData())

            })
        
        })


    }

    fetchData = () => {

        console.log('Fetching data...');
        this.setState({ loadingText: 'Fetching data...' });

        axios.get(this.state.api.baseUrl + 'action/datastore_search_sql?sql=SELECT%20iso_code%2Cdate%2Ctotal_cases%2Ctotal_deaths%2Cnew_cases_smoothed%2Cnew_deaths%20FROM%20"' + this.state.api.countryData + '"',
            { headers: {
                authorization: process.env.REACT_API_KEY
            }
        }).then((response) => {

            console.log('Got the data...');
            this.setState({ loadingText: 'Got the data...' });


            console.log(response);

            // Set up an array with all the countries

            let allCountries = [];

            this.state.countries.forEach((country) => {
                allCountries.push(country);
            })

            let finalCountriesData = allCountries;


            // Add an empty values array where we will story each day's data.

            finalCountriesData.forEach((country) => {
                country.values = [];
                country.allValues = []; // We added this to keep access to the complete dataset
            })

            console.log('Sorting data...');
            this.setState({ loadingText: 'Sorting data...' });

            // loop through the incoming records and add it to the related country's new values array.
            
            response.data.result.records.forEach((data) => {

                let iso_code = data.iso_code;

                let related_country_index = _.findIndex(finalCountriesData, o => { 
                    return o.iso_code == iso_code
                });

                if(related_country_index > -1) {
                    finalCountriesData[related_country_index].allValues.push(data);
                }

            })

            // Loop through each country and fill in missing days. And also sort it.

            console.log('Finding gaps in the data...');
            this.setState({ loadingText: 'Finding gaps in the data...' });

            finalCountriesData.forEach((country) => {

                let sortedFilledArray = [];

                for (let index = 0; index < this.state.dates.length; index++) {
                    
                    if(_.find(country.allValues, o => o.date == this.state.dates[index]) == undefined) {

                        country.allValues.push({
                            iso_code: country.iso_code,
                            date: this.state.dates[index],
                            total_cases: '0',
                            total_deaths: '0',
                            new_cases_smoothed: '0',
                            new_deaths: '0'
                        })
                    }
                    
                }

                sortedFilledArray = _.sortBy(country.allValues, (o) => { return o.date; } );
                country.allValues = sortedFilledArray;
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

            this.setState({
                data: finalCountriesData,
            }, () => this.executeQuery())

        })
    }

    executeQuery = () => {
        console.log('Flying over landscape...');
        this.setState({ 
            loadingText: 'Flying over landscape...' 
        });

        let filteredData = _.filter(this.state.data, d => this.state.selectedCountries.indexOf(d.iso_code) > -1 );

        filteredData.forEach(country => {
            let filteredValues = _.filter(country.allValues, d => this.state.dateRange.indexOf(d.date) > -1 );
            country.values = filteredValues; 
        })


        this.setState({
            currentData: filteredData,
            loading: false
        });


    }

   

    filterByCountry = (e) => {

        let values = e.target.attributes.value.value.split(',');

        let selectedCountries = this.state.selectedCountries;

        values.forEach((value) => {

            if(selectedCountries.indexOf(value) == -1) {
                selectedCountries.push(value);
            } else {
                selectedCountries = _.without(selectedCountries, value)
            }

        })

        this.setState({
            loading: true,
            selectedCountries: selectedCountries,
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

    onSlide = (e) => {

        this.setState({
            startDate: parseInt(e[0]),
            endDate: parseInt(e[1])
        })

    }

    onEnd = (e) => {

        let date_range = _.filter(this.state.dates, (d,i) => { return i >= parseInt(e[0]) && i <= parseInt(e[1]) });

        this.setState({
                loading: true,
                startDate: parseInt(e[0]),
                endDate: parseInt(e[1]),
                dateRange: date_range,
            }, () => this.executeQuery()
        )
    }
    
    render() {
        return  <>
                <header>
                    <Container className="py-4">
                        <Row>
                            <Col xs="auto">
                                <DropdownButton title="Selected Countries" variant="control-grey" className="country-select" autoClose="outside">
                                    <Dropdown.Item style={{background: this.state.selectedCountries.length == 55 ? 'rgba(138, 164, 171, 0.1)' : 'transparent'}}>
                                        <div className="d-inline-block me-2">
                                            <div className={this.state.selectedCountries.length == 55 ? 'custom-checkbox custom-checkbox-checked' : 'custom-checkbox'} onClick={(e) => this.filterByCountry(e)} value={this.state.countries.map((country) => country.iso_code)}/>
                                        </div>
                                        <div className="text-black d-inline-block ms-1" style={{position: 'relative', top: '-5px'}}>All Countries</div>
                                    </Dropdown.Item>
                                    {this.state.countriesSelectBox.map((country,index) => (
                                        <Dropdown.Item key={country.iso_code} style={{background: _.find(this.state.selectedCountries, o => o == country.iso_code) != undefined ? 'rgba(138, 164, 171, 0.1)' : 'transparent'}}>
                                            <div className="d-inline-block me-2">
                                                <div className={_.find(this.state.selectedCountries, o => o == country.iso_code) != undefined ? 'custom-checkbox custom-checkbox-checked' : 'custom-checkbox'} onClick={(e) => this.filterByCountry(e)} value={country.iso_code}/>
                                            </div>
                                            { country.region ?
                                                <div style={{width: '1.5em', height: '1.5em', borderRadius: '50%', overflow: 'hidden', position: 'relative', display: 'inline-block'}} className="border">
                                                    <ReactCountryFlag
                                                    svg
                                                    countryCode={getCountryISO2(country.iso_code)}
                                                    style={{
                                                        position: 'absolute', 
                                                        top: '30%',
                                                        left: '30%',
                                                        marginTop: '-50%',
                                                        marginLeft: '-50%',
                                                        fontSize: '2em',
                                                        lineHeight: '2em',
                                                    }}/>
                                                </div>
                                            : '' }
                                            <div className="text-black d-inline-block ms-1" style={{position: 'relative', top: '-5px'}}>{country.location}</div>
                                        </Dropdown.Item>
                                    ))}
                                </DropdownButton>
                                
                            </Col>
                            <Col xs="auto">
                                <Form.Select className="control-grey" onChange={this.selectMetric} value={this.state.selectedMetric}>
                                    <option value="new_cases_smoothed">New Cases Smoothed</option>
                                    <option value="new_deaths">New Deaths</option>
                                </Form.Select>
                            </Col>
                            <Col className="px-4">
                                <Nouislider
                                    onSlide={this.onSlide}
                                    onEnd={this.onEnd}
                                    range={{ min: 0, max: this.state.dates.length - 1 }}
                                    step={1}
                                    start={[ 0, this.state.dates.length - 1 ]}
                                    connect={true}
                                    pips= {{
                                        mode: 'count',
                                        values: 6,
                                        density: 4,
                                        stepped: true
                                    }} />
                            </Col>
                            <Col xs="auto">
                                <h4 className="pt-2" style={{width: '200px'}}>{ moment(this.state.dates[this.state.startDate]).format('DD/MM/YY') } - { moment(this.state.dates[this.state.endDate]).format('DD/MM/YY') }</h4>
                            </Col>
                        </Row>
                    </Container>
                </header>

                { this.state.loading ? 
                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                        <Spinner animation="grow" />
                        <h3 className="mt-4">{ this.state.loadingText }</h3>
                        <Container></Container>
                    </div>
                : 
                    <Container className="mt-4">
                        <Card className="mt-4">
                            <JoyChart 
                                data={ this.state.currentData }
                                countries={ this.state.countries }
                                dates={ this.state.dateRange }
                                selectedMetric= { this.state.selectedMetric }
                            />
                        </Card>
                    </Container>
                }
            </>
          
    }

}

const container = document.getElementsByClassName('app')[0];
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
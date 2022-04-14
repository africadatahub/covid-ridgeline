import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import axios from 'axios';
import {csv} from 'd3-fetch';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';

import 'react-dates/initialize';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';

import { CheckBoxSelection, Inject, MultiSelectComponent } from '@syncfusion/ej2-react-dropdowns';

import { JoyChart } from './components/JoyChart';

import './app.scss';
import { select } from 'd3';


export class App extends React.Component {
    
    constructor(){
        super();
        this.state = {
            data: [],
            dates: [],
            startDate: null,
            endDate: null,
            focusedInput: null,
            focused: false,
            regions: [],
            countries: [],
            selectedCountries: [],
            currentData: [],
            // CheckBoxSelection: []
        }
    }

    componentDidMount() {
        let self = this;
        
        Promise.all([
            csv("./new_cases_smoothed.csv"),
            csv("./regions.csv"),
        ]).then((files) => {

            let data = files[0];
            let regions = files[1];

            let regionsList = regions.map((region) => {
                return region.region;
            })

            let uniqIds1 = {}, source1 = regionsList;
            regionsList = source1.filter(obj => !uniqIds1[obj] && (uniqIds1[obj] = true));

            let countries = data.map((country) => {

                let region = regions.find(regionCountry => regionCountry.iso_code === country.iso_code);

                return {
                    iso_code: country.iso_code,
                    location: region.country,
                    region: region.region,
                    value: country.iso_code,
                    label: region.country           
                }
            })

            let dates = []

            for (const date in data[0]) {
                dates.push(date)
            }

            dates.splice(0,1);

            let transformedData = [];

            for (let index = 0; index < data.length; index++) {

                let region = countries.find((country) => country.iso_code === data[index].iso_code).region;

                let region_order = ['Northern Africa', 'Eastern Africa', 'Central Africa', 'Western Africa', 'Southern Africa'];

                let countryData = {
                    iso_code: data[index].iso_code,
                    region: region,
                    order: _.findIndex(region_order, o => o == region),
                    values: []
                }

                for(const date in data[index]) {
                    if (date != 'iso_code') {
                        countryData.values.push({
                            date: date,
                            value: data[index][date]
                        })
                    }
                }

                transformedData.push(countryData);
            }   

            let sortedData = _.sortBy(transformedData, 'order');  
            
            this.setState(
                {   
                    dates: dates,
                    data: sortedData,
                    regions: regionsList,
                    countries: countries,
                    currentData: sortedData
                }
            );



        }).catch(function(err) {

            console.log(err)

        })


    }
    componentDidUpdate() {}

    filterByCountry = (e) => {

        let selectedCountries = e.value;

        let filteredData = _.filter(this.state.data, (o) => { return selectedCountries.map((country) => country).indexOf(o.iso_code) > -1 });

        this.setState({
            currentData: filteredData
        });
    }

    select_dates = ({ startDate, endDate }) => {

        this.setState({ startDate, endDate });
    
    }

    setCurrentDate = (e) => {
        console.log(e);
    }
    
    render() {
        return <> 
            <header>
                <Container className="py-4">
                    <Row>
                        <Col>
                            <MultiSelectComponent id="mtselement" popupHeight='600px' fields={{ groupBy: 'region', text: 'label', value: 'value' }} dataSource={this.state.countries} placeholder="Select Countries" mode="CheckBox" enableGroupCheckBox="true" allowFiltering="true" showSelectAll="true" filterBarPlaceholder="Search Countries" change={this.filterByCountry}>
                                <Inject services={[CheckBoxSelection]} />
                            </MultiSelectComponent>
                            
                        </Col>
                        <Col>
                            <DateRangePicker
                                startDate={this.state.startDate} 
                                startDateId="startDate" 
                                endDate={this.state.endDate} 
                                endDateId="endDate" 
                                onDatesChange={this.select_dates} 
                                focusedInput={this.state.focusedInput} 
                                onFocusChange={focusedInput => this.setState({ focusedInput })} 
                                startDatePlaceholderText='START'
                                endDatePlaceholderText='END'
                                small={true}
                                isOutsideRange={() => false}
                                displayFormat='DD/MM/YYYY'
                            />
                        </Col>
                    </Row>
                </Container>
            </header>
            <Container className="mt-4">
                { this.state.currentData.length > 0 ?
                    <Card className="mt-4">
                        <JoyChart data={ this.state.currentData } countries={ this.state.countries } dates={ this.state.dates } currentDate={this.setCurrentDate} />
                    </Card>
                    : '' 
                }
            </Container>
        </>
    }

}

const container = document.getElementsByClassName('app')[0];
ReactDOM.render(React.createElement(App), container);
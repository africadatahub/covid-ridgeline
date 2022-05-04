import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';
import _ from 'lodash';
import * as settings from '../data/settings.json';

export class CountrySelect extends React.Component {
    
    constructor(){
        super();
        this.state = {
            colors: settings.themes[0]
        }
    }

    componentDidMount() {
    }

    isSelected(country) {

        let iso_codes = [];

        if(!Array.isArray(country.iso_code)) {
            iso_codes[0] = country.iso_code;
        } else {
            iso_codes = country.iso_code;
        }

        return iso_codes.every(iso_code => this.props.selectedCountries.includes(iso_code));
    }

    getStyle(country) {
        
        let color = 'black';
        let fontWeight = 'normal';
        let fontSize = '1em';

        if(this.state.colors.map(region => region.region).includes(country.location)) {
            color = _.find(this.state.colors, region => region.region == country.location).color;
            fontWeight = 'bold';
            fontSize = '1.1em';
        }
        
        return {
            position: 'relative',
            top: '-5px',
            color: color,
            fontWeight: fontWeight,
            fontSize: fontSize
        }
    }

    render() {
        return <DropdownButton title="Selected Countries" variant="control-grey" className="country-select" autoClose="outside">
            
            <Dropdown.Item style={{background: this.props.selectedCountries.length == 55 ? 'rgba(138, 164, 171, 0.1)' : 'transparent'}}>
                <div className="d-inline-block me-2">
                    <div className={this.props.selectedCountries.length == 55 ? 'custom-checkbox custom-checkbox-checked' : 'custom-checkbox'} onClick={(e) => this.props.filterByCountry(e)} value={this.props.countries.map((country) => country.iso_code)}/>
                </div>
                <div className="text-black d-inline-block ms-1" style={{position: 'relative', top: '-5px'}}>All Countries</div>
            </Dropdown.Item>
            
            {this.props.countriesSelectBox.map((country,index) => (
                
                <Dropdown.Item key={country.iso_code} style={{background: this.isSelected(country) ? 'rgba(138, 164, 171, 0.1)' : 'transparent', paddingTop: '10px'}}>
                    <div className="d-inline-block me-2">
                        <div className={this.isSelected(country) ? 'custom-checkbox custom-checkbox-checked' : 'custom-checkbox'} onClick={(e) => this.props.filterByCountry(e)} value={country.iso_code}/>
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
                    <div className="d-inline-block ms-1" style={this.getStyle(country)}>{country.location}</div>
                </Dropdown.Item>
            
            ))}
        </DropdownButton>
    }

}    
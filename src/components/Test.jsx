import React from 'react';

export class Test extends React.Component {
    
    constructor(){
        super();
        this.state = {
        }
    }

    componentDidMount() {

        console.log('TEST mounting');
     

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

        if (snapshot !== null) {
            console.log(snapshot);
        }

      
        
    }

    

    
    render() {
        return 'TEST'
    }

}

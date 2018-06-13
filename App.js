import React from 'react'
import { Constants, Location, Permissions } from 'expo'
import { StyleSheet, Text, View } from 'react-native'
import Places from 'google-places-web'
import Geo from 'geodesy'

Places.apiKey = 'AIzaSyCneSbDKqwD6g4agqJJOzphPUXvyoT1Bsw'
Places.debug = __DEV__ // boolean;

export default class App extends React.Component {
  constructor() {
    super()
    this.state = {
      target: {},
    }
  }

  componentDidMount = async () => {
    console.log('mounted')
    let { status } = await Permissions.askAsync(Permissions.LOCATION)
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      })
    }
    try {
      let location = await Location.getCurrentPositionAsync({})
      this.setState({ location: location })
      let places = await Places.nearbysearch({
        location: `${location.coords.latitude},${location.coords.longitude}`,
        rankby: 'distance',
        opennow: true,
        type: ['cafe'],
      })

      this.setState({ target: places[0] })
    } catch (err) {
      console.log(err)
    }
  }

  _bearing() {
    const latLng = new Geo(
      this.state.location.coords.latitude,
      this.state.location.coords.longitude,
    )
    const bearing = latLng.bearingTo(this.state.target.geometry.location)
    return bearing
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>{JSON.stringify(this.state.target)}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

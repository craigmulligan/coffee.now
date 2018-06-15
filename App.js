import React from 'react'
import { Constants, Location, Permissions, Haptic } from 'expo'
import { StyleSheet, Text, View } from 'react-native'
import Places from 'google-places-web'
import { LatLonSpherical as Geo } from 'geodesy'
import { Ionicons } from '@expo/vector-icons'

Places.apiKey = ''
Places.debug = __DEV__ // boolean;

export default class App extends React.Component {
  constructor() {
    super()
    this.state = {
      target: {},
      bearing: 0,
    }
  }

  componentDidMount = async () => {
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

      this.setState({ target: places[0] }, () => {
        this._bearing()
      })
    } catch (err) {
      console.log(err)
    }
  }

  _bearing() {
    Expo.Location.watchHeadingAsync(({ trueHeading }) => {
      const latLng = new Geo(
        this.state.location.coords.latitude,
        this.state.location.coords.longitude,
      )

      const targetLocale = this.state.target.geometry.location
      const to = new Geo(targetLocale.lat, targetLocale.lng)
      const bearing = latLng.bearingTo(to)

      this.setState({
        bearing: bearing - trueHeading,
        distance: latLng.distanceTo(to),
      })

      return bearing
    })
  }

  _areWeThereYet() {
    if (this.state.distance < 20) {
      this.setState(
        {
          journey: {
            complete: true,
          },
        },
        () => {
          Haptic.notification(Haptic.NotificationTypes.Success)
        },
      )
    }
  }

  _style() {
    return StyleSheet.create({
      arrow: {
        transform: [{ rotateZ: `${this.state.bearing}deg` }],
      },
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>{this.state.bearing}</Text>
        <Text>{this.state.distance}</Text>
        <Ionicons style={this._style().arrow} name="md-arrow-up" size={500} />
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
  arrow: {
    transform: [{ rotateZ: '45deg' }],
  },
})

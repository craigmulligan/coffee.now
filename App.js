import React from 'react'
import { Constants, Location, Permissions, Haptic } from 'expo'
import { StyleSheet, Text, View } from 'react-native'
import Places from 'google-places-web'
import { LatLonSpherical as Geo } from 'geodesy'
import { Ionicons } from '@expo/vector-icons'
import Shake from './shake'

Places.apiKey = Constants.manifest.extra.places_api_key
Places.debug = __DEV__ // boolean;
const COOLORS = ['#FFCD72', '#FF928B']

export default class App extends React.Component {
  constructor() {
    super()
    this.shake = new Shake()
    this.state = {
      target: {},
      bearing: 0,
      journey_complete: false,
    }
  }

  componentDidMount = async () => {
    this.shake.start(() => {
      this.setState(prevState => ({
        journey_complete: !prevState.journey_complete,
      }))

      Haptic.notification(Haptic.NotificationTypes.Success)
    })

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

  componentWillUnmount() {
    this.shake.stop()
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
          journey_complete: true,
        },
        () => {
          Haptic.notification(Haptic.NotificationTypes.Success)
        },
      )
    }
  }

  _style() {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: COOLORS[Number(this.state.journey_complete)],
        alignItems: 'center',
        justifyContent: 'center',
      },
      arrow: {
        color: COOLORS[Number(!this.state.journey_complete)],
        transform: [{ rotateZ: `${this.state.bearing}deg` }],
      },
    })
  }

  render() {
    const styles = this._style()
    return (
      <View style={styles.container}>
        <Text>{this.state.bearing}</Text>
        <Text>{this.state.distance}</Text>
        <Ionicons style={styles.arrow} name="md-arrow-up" size={500} />
      </View>
    )
  }
}

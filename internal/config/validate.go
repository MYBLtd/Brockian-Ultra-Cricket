package config

import "fmt"

func Validate(cfg *AllConfig) error {
	for name, comp := range cfg.Components.Components {
		if comp.Source != "" {
			if _, ok := cfg.Sources.Sources[comp.Source]; !ok {
				return fmt.Errorf("component %q references unknown source %q", name, comp.Source)
			}
		}
	}

	for name, screen := range cfg.Screens.Screens {
		for _, comps := range screen.Regions {
			for _, compName := range comps {
				if _, ok := cfg.Components.Components[compName]; !ok {
					return fmt.Errorf("screen %q references unknown component %q", name, compName)
				}
			}
		}
	}

	for name, dev := range cfg.Devices.Devices {
		if _, ok := cfg.Screens.Screens[dev.Screen]; !ok {
			return fmt.Errorf("device %q references unknown screen %q", name, dev.Screen)
		}
		if _, ok := cfg.Themes.Themes[dev.Theme]; !ok {
			return fmt.Errorf("device %q references unknown theme %q", name, dev.Theme)
		}
		if dev.Resolution.Width <= 0 || dev.Resolution.Height <= 0 {
			return fmt.Errorf("device %q has invalid resolution", name)
		}
	}

	for themeName, theme := range cfg.Themes.Themes {
		for scaleName, scale := range theme.TemperatureScales {
			for _, band := range scale.Bands {
				if _, ok := theme.Tokens[band.Token]; !ok {
					return fmt.Errorf("theme %q scale %q references unknown token %q", themeName, scaleName, band.Token)
				}
			}
		}
	}

	return nil
}

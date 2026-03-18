package config

type SourcesFile struct {
	Sources map[string]SourceConfig `json:"sources"`
}

type SourceConfig struct {
	Type     string `json:"type"`
	EntityID string `json:"entity_id,omitempty"`
}

type ComponentsFile struct {
	Components map[string]ComponentConfig `json:"components"`
}

type ComponentConfig struct {
	Type    string                 `json:"type"`
	Source  string                 `json:"source,omitempty"`
	Options map[string]interface{} `json:"options,omitempty"`
}

type ScreensFile struct {
	Screens map[string]ScreenConfig `json:"screens"`
}

type ScreenConfig struct {
	Layout  string              `json:"layout"`
	Title   string              `json:"title,omitempty"`
	Regions map[string][]string `json:"regions"`
}

type DevicesFile struct {
	Devices map[string]DeviceConfig `json:"devices"`
}

type DeviceConfig struct {
	Mode           string           `json:"mode"`
	Screen         string           `json:"screen"`
	Theme          string           `json:"theme"`
	Orientation    string           `json:"orientation"`
	Resolution     ResolutionConfig `json:"resolution"`
	RefreshSeconds int              `json:"refresh_seconds"`
}

type ResolutionConfig struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type ThemesFile struct {
	Themes map[string]ThemeConfig `json:"themes"`
}

type ThemeConfig struct {
	Tokens            map[string]string              `json:"tokens"`
	TemperatureScales map[string]TemperatureScaleDef `json:"temperature_scales"`
}

type TemperatureScaleDef struct {
	Bands []TemperatureBand `json:"bands"`
}

type TemperatureBand struct {
	Max   float64 `json:"max"`
	Token string  `json:"token"`
}

type AllConfig struct {
	Sources    SourcesFile
	Components ComponentsFile
	Screens    ScreensFile
	Devices    DevicesFile
	Themes     ThemesFile
}

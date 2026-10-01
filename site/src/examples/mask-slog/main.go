package main

import (
	"log/slog"
	"os"

	"github.com/haikalmumtaz233/nusaindex/mask"
)

func main() {
	plain := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		ReplaceAttr: func(_ []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey {
				return slog.Attr{}
			}
			return a
		},
	})
	logger := slog.New(mask.NewHandler(plain))

	logger.Info("signup 7502010706599583", slog.String("phone", "085952571710"))
}
